// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/**
 * @title EncumbranceLedger
 * @notice Vault-based encumbrance enforcement for tokenized assets on Hedera ATS.
 *
 * The ledger contract is the on-chain token holder (vault) for each platform asset. The
 * asset's beneficiary deposits its full balance into the vault; banks (creditors) then
 * draw credit lines which materialize as ATS holds locked inside the vault. Every lock
 * reduces the vault's available units, therefore the same unit can never back two claims
 * at once (double-pledging is structurally impossible).
 *
 * Value shocks are detected via Chainlink price feeds: when the coverage ratio (collateral
 * USD / outstanding USD) drops below the platform threshold, or the platform matures while
 * positions are open, anyone can call settle() and the vault executes each hold into its
 * creditor's account - each bank recovers the pledged collateral on-chain.
 *
 * The ledger is an external caller of an ATS diamond; no facet is registered on it.
 * Hold escrow == this contract, destination unconstrained (released back to the vault or
 * executed into a creditor).
 */
interface IChainlinkFeed {
    function decimals() external view returns (uint8);
    function latestRoundData()
        external
        view
        returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound);
}

interface IATS {
    struct Hold {
        uint256 amount;
        uint256 expirationTimestamp;
        address escrow;
        address to;
        bytes data;
    }
    struct HoldIdentifier {
        bytes32 partition;
        address tokenHolder;
        uint256 holdId;
    }
    function createHoldByPartition(bytes32 partition, Hold memory hold) external returns (bool success, uint256 holdId);
    function executeHoldByPartition(HoldIdentifier memory ident, address to, uint256 amount)
        external
        returns (bool success, bytes32 partition);
    function releaseHoldByPartition(HoldIdentifier memory ident, uint256 amount) external returns (bool success);
    function balanceOf(address who) external view returns (uint256);
}

contract EncumbranceLedger {
    /* ------------------------------------------------------------------ constants - */
    bytes32 public constant PARTITION_ID_1 = 0x0000000000000000000000000000000000000000000000000000000000000001;
    uint256 public constant MAX_BORROWERS_PER_PLATFORM = 32;
    uint256 public constant MAX_THRESHOLD_BPS = 20_000;
    address internal constant ZERO = address(0);

    /* --------------------------------------------------------------------- state - */
    address public owner;
    uint256 public staleAfterSec;
    uint256 private _locked; // 0 = free, 1 = in critical section

    struct Platform {
        address token; // ATS diamond for the platform asset
        address feed; // Chainlink aggregator
        uint8 feedDecimals;
        uint8 tokenDecimals;
        uint256 coverageThresholdBps;
        uint256 interestBps; // prepaid yield markup applied to a drawn unit (basis points)
        uint256 borrowCapUnits;
        uint256 maturityTs; // 0 => hold expiry = now + defaultGraceSec
        uint256 defaultGraceSec;
        bool active;
        bool liquidated;
        uint256 totalDepositedUnits;
        uint256 totalEncumberedUnits;
        address[] creditors;
    }

    struct Position {
        uint256 loanUnits;
        uint256 loanUnitUsd18; // USD per encumbered unit at borrow time (incl. interest), 18 dp
        uint256 holdId;
        uint256 createdAt;
    }

    mapping(bytes32 => Platform) public platforms;
    mapping(bytes32 => mapping(address => uint256)) public deposits; // platform => depositor => vault units
    mapping(bytes32 => mapping(address => Position)) public positions; // platform => creditor => encumbrance
    mapping(bytes32 => mapping(address => bool)) public isDefaulted;

    /* --------------------------------------------------------------------- events - */
    event PlatformConfigured(
        bytes32 indexed platformId, address token, address feed, uint256 coverageThresholdBps, uint256 borrowCapUnits
    );
    event Deposited(bytes32 indexed platformId, address indexed depositor, uint256 units);
    event EncumbranceCreated(bytes32 indexed platformId, address indexed creditor, uint256 units, uint256 unitUsd18, uint256 holdId);
    event EncumbranceReleased(bytes32 indexed platformId, address indexed creditor, uint256 units);
    event CollateralWithdrawn(bytes32 indexed platformId, address indexed depositor, uint256 units);
    event PlatformLiquidated(bytes32 indexed platformId, uint256 coverageBps, uint256 thresholdBps);
    event StaleAfterUpdated(uint256 staleAfterSec);
    event DefaultGraceUpdated(bytes32 indexed platformId, uint256 graceSec);

    /* -------------------------------------------------------------------- errors - */
    error ReentrantCall();
    error OnlyOwner(address caller);
    error ZeroAddress();
    error ZeroValue();
    error PlatformNotConfigured(bytes32 platformId);
    error PlatformNotActive(bytes32 platformId);
    error PlatformLiquidatedError(bytes32 platformId);
    error NotDepositor(bytes32 platformId, address caller);
    error PositionAlreadyOpen(bytes32 platformId, address creditor);
    error PositionNotFound(bytes32 platformId, address creditor);
    error TooManyBorrowers(bytes32 platformId);
    error InsufficientCollateral(bytes32 platformId, uint256 requestedUnits, uint256 availableUnits);
    error CoverageBelowThreshold(bytes32 platformId, uint256 coverageBps, uint256 thresholdBps);
    error PriceNotPositive(bytes32 platformId, int256 answer);
    error StalePrice(bytes32 platformId, uint256 updatedAt);
    error AtsNotAllowed(address token);

    /* ------------------------------------------------------------------ modifiers - */
    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner(msg.sender);
        _;
    }

    modifier nonReentrant() {
        if (_locked != 0) revert ReentrantCall();
        _locked = 1;
        _;
        _locked = 0;
    }

    constructor() {
        owner = msg.sender;
        staleAfterSec = 24 hours;
    }

    /* -------------------------------------------------------------- configuration - */
    /**
     * @notice Registers (or reconfigures) a platform.
     * @param maturityTs_ 0 => hold expiry derived from defaultGraceSec at borrow time,
     *                    so assets without a populated maturity still get a bounded lock.
     */
    function configurePlatform(
        bytes32 platformId,
        address token_,
        address feed_,
        uint8 tokenDecimals_,
        uint256 coverageThresholdBps_,
        uint256 interestBps_,
        uint256 borrowCapUnits_,
        uint256 maturityTs_
    ) external onlyOwner {
        if (token_ == ZERO || feed_ == ZERO) revert ZeroAddress();
        if (coverageThresholdBps_ == 0 || coverageThresholdBps_ > MAX_THRESHOLD_BPS) revert ZeroValue();
        if (borrowCapUnits_ == 0) revert ZeroValue();

        Platform storage p = platforms[platformId];
        p.token = token_;
        p.feed = feed_;
        p.feedDecimals = IChainlinkFeed(feed_).decimals();
        p.tokenDecimals = tokenDecimals_;
        p.coverageThresholdBps = coverageThresholdBps_;
        p.interestBps = interestBps_;
        p.borrowCapUnits = borrowCapUnits_;
        p.maturityTs = maturityTs_;
        p.defaultGraceSec = maturityTs_ == 0 ? 180 days : 0;
        p.active = true;

        emit PlatformConfigured(platformId, token_, feed_, coverageThresholdBps_, borrowCapUnits_);
    }

    function setStaleAfter(uint256 sec) external onlyOwner {
        if (sec == 0) revert ZeroValue();
        staleAfterSec = sec;
        emit StaleAfterUpdated(sec);
    }

    function setPlatformDefaultGrace(bytes32 platformId, uint256 graceSec) external onlyOwner {
        if (graceSec == 0) revert ZeroValue();
        platforms[platformId].defaultGraceSec = graceSec;
        emit DefaultGraceUpdated(platformId, graceSec);
    }

    /* ----------------------------------------------------------------- pledge flow - */
    /**
     * @notice Re-attributes vault units to `depositor`. The underlying token transfer to
     *         this vault must already have happened; `deposits` is bookkeeping only. The
     *         vault's on-chain balanceOf(token) is the source of truth for supply.
     */
    function deposit(bytes32 platformId, address depositor, uint256 units) external {
        if (units == 0) revert ZeroValue();
        Platform storage p = _requireActive(platformId);
        if (msg.sender != depositor && msg.sender != owner) revert NotDepositor(platformId, msg.sender);
        deposits[platformId][depositor] += units;
        p.totalDepositedUnits += units;
        emit Deposited(platformId, depositor, units);
    }

/**
 * @notice Retrieves unencumbered (free) vault units. `availableUnits` is the vault's raw
 *         token balance: ATS holds already deduct the locked amount from `balanceOf`, so
 *         no further subtraction is made.
 * @dev Facade transfers are resolver-gated on deployed diamonds, so value leaves the
 *      vault through the always-whitelisted hold primitives instead: the vault creates a
 *      transient escrow hold over `units` and executes it to the depositor.
 */
function withdraw(bytes32 platformId, uint256 units) external nonReentrant {
    if (units == 0) revert ZeroValue();
    Platform storage p = _requireActive(platformId);
    if (deposits[platformId][msg.sender] < units) revert NotDepositor(platformId, msg.sender);

    uint256 avail = vaultBalanceUnits(platformId);
    if (units > avail) revert InsufficientCollateral(platformId, units, avail);

    uint256 expiry = p.maturityTs;
    if (expiry == 0) expiry = block.timestamp + p.defaultGraceSec;
    IATS.Hold memory hold = IATS.Hold({
        amount: units,
        expirationTimestamp: expiry,
        escrow: address(this),
        to: msg.sender,
        data: ""
    });
    (bool created, uint256 transientHoldId) = IATS(p.token).createHoldByPartition(PARTITION_ID_1, hold);
    if (!created) revert AtsNotAllowed(p.token);

    deposits[platformId][msg.sender] -= units;
    p.totalDepositedUnits -= units;

    (bool ok,) = IATS(p.token).executeHoldByPartition(
        IATS.HoldIdentifier({ partition: PARTITION_ID_1, tokenHolder: address(this), holdId: transientHoldId }),
        msg.sender,
        units
    );
    if (!ok) revert AtsNotAllowed(p.token);
    emit CollateralWithdrawn(platformId, msg.sender, units);
}

    /* --------------------------------------------------------------- credit line flow - */
    /**
     * @notice Bank `creditor` draws `units` of credit against the platform collateral.
     * @dev Rejects (a) when the vault does not hold enough free units (OverPledge) or
     *      (b) when the post-draw coverage ratio is below the platform threshold.
     *      On success an ATS hold of exactly `units` is created with this contract as
     *      escrow and unconstrained destination.
     */
    function requestLoan(bytes32 platformId, address creditor, uint256 units)
        external
        nonReentrant
        returns (uint256 holdId)
    {
        if (units == 0) revert ZeroValue();
        if (creditor == ZERO || creditor == address(this)) revert ZeroAddress();
        Platform storage p = _requireActive(platformId);
        if (positions[platformId][creditor].loanUnits != 0) revert PositionAlreadyOpen(platformId, creditor);

        // AVAILABILITY: ATS holds already deduct `units` from the vault's balanceOf at
        // create time, so free units == the vault's token balance (no double count).
        uint256 avail = vaultBalanceUnits(platformId);
        if (units > avail) revert InsufficientCollateral(platformId, units, avail);

        uint256 capRemaining = p.borrowCapUnits > p.totalEncumberedUnits
            ? p.borrowCapUnits - p.totalEncumberedUnits
            : 0;
        if (units > capRemaining) revert InsufficientCollateral(platformId, units, capRemaining);

        // coverage gate (post-draw): collateral = free + locked units; outstanding = prior + new draw
        uint256 unitUsd18 = _unitUsd18(p, platformId);
        uint256 unitUsdMarked = (unitUsd18 * (10_000 + p.interestBps)) / 10_000;
        uint256 backingUsd = (avail + p.totalEncumberedUnits) * unitUsd18;
        uint256 outstanding = outstandingUsd18Of(platformId) + units * unitUsdMarked;
        uint256 coverageBps = (backingUsd * 10_000) / outstanding;
        if (coverageBps < p.coverageThresholdBps) {
            revert CoverageBelowThreshold(platformId, coverageBps, p.coverageThresholdBps);
        }

        if (p.creditors.length >= MAX_BORROWERS_PER_PLATFORM) revert TooManyBorrowers(platformId);

        uint256 expiry = p.maturityTs;
        if (expiry == 0) expiry = block.timestamp + p.defaultGraceSec;

        IATS.Hold memory hold = IATS.Hold({
            amount: units,
            expirationTimestamp: expiry,
            escrow: address(this),
            to: ZERO, // unconstrained: released back to vault or executed to the creditor
            data: ""
        });
        (bool ok, uint256 newHoldId) = IATS(p.token).createHoldByPartition(PARTITION_ID_1, hold);
        if (!ok) revert AtsNotAllowed(p.token);

        positions[platformId][creditor] = Position({
            loanUnits: units,
            loanUnitUsd18: unitUsdMarked,
            holdId: newHoldId,
            createdAt: block.timestamp
        });
        p.creditors.push(creditor);
        p.totalEncumberedUnits += units;

        emit EncumbranceCreated(platformId, creditor, units, unitUsdMarked, newHoldId);
        return newHoldId;
    }

    /**
     * @notice Releases the vault hold for `creditor`, restoring the available balance.
     * @dev Uses the ATS `releaseHoldByPartition` primitive: unlike `execute`, release
     *      carries no identity check on the recipient and returns the units to the
     *      vault's own balance, which is exactly the "release back" semantics needed.
     */
    function repay(bytes32 platformId, address creditor) external nonReentrant returns (uint256 releasedUnits) {
        Platform storage p = platforms[platformId];
        if (!p.active) revert PlatformNotActive(platformId);
        Position storage pos = positions[platformId][creditor];
        uint256 units = pos.loanUnits;
        if (units == 0) revert PositionNotFound(platformId, creditor);

        (bool ok) = IATS(p.token).releaseHoldByPartition(
            IATS.HoldIdentifier({ partition: PARTITION_ID_1, tokenHolder: address(this), holdId: pos.holdId }),
            units
        );
        if (!ok) revert AtsNotAllowed(p.token);

        // CEI: state updates after the external call, but before any further transfer.
        _removeCreditor(p, creditor);
        delete positions[platformId][creditor];
        p.totalEncumberedUnits -= units;

        emit EncumbranceReleased(platformId, creditor, units);
        return units;
    }

    /**
     * @notice Permissionless liquidation. When coverage < threshold or the platform has
     *         matured with positions open, every hold is executed to its creditor (each
     *         bank recovers the pledged collateral) and further draws are frozen.
     */
    function settle(bytes32 platformId) external nonReentrant returns (uint256 liquidatedPositions) {
        Platform storage p = platforms[platformId];
        if (!p.active) revert PlatformNotActive(platformId);
        if (p.liquidated) return 0;

        uint256 coverageBps = coverageBpsOf(platformId);
        bool matured = p.maturityTs != 0 && block.timestamp >= p.maturityTs;
        if (coverageBps >= p.coverageThresholdBps && !matured) return 0;

        // CEI: freeze liquidated flag before the external hold executions.
        p.liquidated = true;
        emit PlatformLiquidated(platformId, coverageBps, p.coverageThresholdBps);

        address[] memory creditors = p.creditors;
        for (uint256 i = 0; i < creditors.length; i++) {
            address cr = creditors[i];
            Position memory pos = positions[platformId][cr]; // copy before delete
            uint256 units = pos.loanUnits;
            if (units == 0) continue;
            isDefaulted[platformId][cr] = true;
            delete positions[platformId][cr];
            (bool ok,) = IATS(p.token).executeHoldByPartition(
                IATS.HoldIdentifier({ partition: PARTITION_ID_1, tokenHolder: address(this), holdId: pos.holdId }),
                cr,
                units
            );
            if (!ok) revert AtsNotAllowed(p.token);
            liquidatedPositions++;
        }
        p.totalEncumberedUnits = 0;
        delete p.creditors;
        return liquidatedPositions;
    }

    /* ----------------------------------------------------------------------- views - */
    function _requireActive(bytes32 platformId) internal view returns (Platform storage p) {
        p = platforms[platformId];
        if (!p.active) revert PlatformNotConfigured(platformId);
        if (p.liquidated) revert PlatformLiquidatedError(platformId);
    }

    function _removeCreditor(Platform storage p, address creditor) internal {
        address[] storage list = p.creditors;
        for (uint256 i = 0; i < list.length; i++) {
            if (list[i] == creditor) {
                list[i] = list[list.length - 1];
                list.pop();
                return;
            }
        }
    }

    function creditorsOf(bytes32 platformId) external view returns (address[] memory) {
        return platforms[platformId].creditors;
    }

    function positionLoanUnitUsd18(bytes32 platformId, address creditor) public view returns (uint256) {
        return positions[platformId][creditor].loanUnitUsd18;
    }

    function totalEncumbered(bytes32 platformId) external view returns (uint256) {
        return platforms[platformId].totalEncumberedUnits;
    }

    function totalDeposited(bytes32 platformId) external view returns (uint256) {
        return platforms[platformId].totalDepositedUnits;
    }

    function vaultBalanceUnits(bytes32 platformId) public view returns (uint256) {
        address token = platforms[platformId].token;
        if (token == ZERO) return 0;
        return IATS(token).balanceOf(address(this));
    }

function availableUnits(bytes32 platformId) public view returns (uint256) {
    // ATS holds already removed the locked units from this contract's token balance, so
    // the free (encumberable) amount is exactly the vault's on-chain balance.
    return vaultBalanceUnits(platformId);
}

    /// @notice USD (18 dp) value of a single asset unit from the live price feed.
    function unitUsd18Of(bytes32 platformId) external view returns (uint256) {
        Platform storage p = platforms[platformId];
        if (!p.active) revert PlatformNotConfigured(platformId);
        return _unitUsd18(p, platformId);
    }

    function _unitUsd18(Platform storage p, bytes32 platformId) internal view returns (uint256) {
        (, int256 answer,, uint256 updatedAt,) = IChainlinkFeed(p.feed).latestRoundData();
        if (answer <= 0) revert PriceNotPositive(platformId, answer);
        if (updatedAt == 0 || block.timestamp > updatedAt + staleAfterSec) {
            revert StalePrice(platformId, updatedAt);
        }
        uint256 u = uint256(answer);
        if (p.feedDecimals >= 18) return u / (10 ** (p.feedDecimals - 18));
        return u * (10 ** (18 - p.feedDecimals));
    }

    /// @notice Current USD (18 dp) value of the whole vault for a platform (free + locked).
    function collateralUsd18Of(bytes32 platformId) external view returns (uint256) {
        return (vaultBalanceUnits(platformId) + platforms[platformId].totalEncumberedUnits)
            * _unitUsd18(platforms[platformId], platformId);
    }

    /// @notice Outstanding USD (18 dp): sum from all open positions (loanUnitUsd18 incl. prepaid yield).
    function outstandingUsd18Of(bytes32 platformId) public view returns (uint256) {
        Platform storage p = platforms[platformId];
        address[] memory creditors = p.creditors;
        uint256 total;
        for (uint256 i = 0; i < creditors.length; i++) {
            Position memory pos = positions[platformId][creditors[i]];
            total += pos.loanUnits * pos.loanUnitUsd18;
        }
        return total;
    }

    /// @notice Coverage ratio in basis points (collateral USD / outstanding USD * 1e4).
    /// @dev Collateral = free vault balance + locked (encumbered) units: the locked units
    ///      are still value backing the open positions until the holds are executed.
    function coverageBpsOf(bytes32 platformId) public view returns (uint256) {
        Platform storage p = platforms[platformId];
        if (!p.active) revert PlatformNotConfigured(platformId);
        uint256 outstanding = outstandingUsd18Of(platformId);
        if (outstanding == 0) return type(uint256).max;
        uint256 backing = (vaultBalanceUnits(platformId) + p.totalEncumberedUnits) * _unitUsd18(p, platformId);
        return (backing * 10_000) / outstanding;
    }

    /// @notice Health factor: coverageBps / thresholdBps, 1e18 = 1x.
    function healthFactor18Of(bytes32 platformId) external view returns (uint256) {
        Platform storage p = platforms[platformId];
        if (!p.active) revert PlatformNotConfigured(platformId);
        uint256 t = p.coverageThresholdBps;
        if (t == 0) return 0;
        uint256 c = coverageBpsOf(platformId);
        if (c == type(uint256).max) return type(uint256).max;
        return (c * 1e18) / t;
    }
}
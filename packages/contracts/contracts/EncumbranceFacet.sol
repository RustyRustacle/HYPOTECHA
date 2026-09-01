// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract EncumbranceFacet {
    error ZeroAddress();
    error ZeroAmount();
    error ClaimNotFound();
    error InvalidClaimState();
    error UnauthorizedAccess();
    error InsufficientAvailableBalance(uint256 requested, uint256 available);

    enum ClaimStatus {
        Active,
        Released,
        Defaulted
    }

    struct EncumbranceClaim {
        bytes32 claimId;
        address token;
        address obligor;
        address claimant;
        uint256 amount;
        ClaimStatus status;
        uint256 createdAt;
        uint256 updatedAt;
    }

    event AssetBalanceSet(address indexed token, address indexed obligor, uint256 balance);

    event EncumbranceCreated(
        bytes32 indexed claimId,
        address indexed token,
        address indexed obligor,
        address claimant,
        uint256 amount
    );

    event EncumbranceReleased(
        bytes32 indexed claimId,
        address indexed releasedBy,
        uint256 timestamp
    );

    event EncumbranceDefaulted(
        bytes32 indexed claimId,
        address indexed admin,
        uint256 timestamp
    );

    event EncumbranceRejected(
        address indexed token,
        address indexed obligor,
        uint256 requestedAmount,
        uint256 availableAmount,
        string reason
    );

    address public owner;
    uint256 public claimCounter;

    mapping(address => mapping(address => uint256)) public tokenBalances;
    mapping(address => mapping(address => uint256)) public totalHeld;
    mapping(bytes32 => EncumbranceClaim) public claims;
    mapping(address => bytes32[]) public claimsByObligor;

    modifier onlyOwner() {
        if (msg.sender != owner) revert UnauthorizedAccess();
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function setTokenBalance(address token, address obligor, uint256 balance) external onlyOwner {
        if (token == address(0) || obligor == address(0)) revert ZeroAddress();
        tokenBalances[token][obligor] = balance;
        emit AssetBalanceSet(token, obligor, balance);
    }

    function createClaim(
        address token,
        address obligor,
        address claimant,
        uint256 amount
    ) external returns (bytes32 claimId) {
        if (token == address(0) || obligor == address(0) || claimant == address(0)) {
            revert ZeroAddress();
        }
        if (amount == 0) revert ZeroAmount();

        uint256 available = getAvailableBalance(token, obligor);
        if (amount > available) {
            emit EncumbranceRejected(token, obligor, amount, available, 'insufficient unencumbered balance');
            revert InsufficientAvailableBalance({ requested: amount, available: available });
        }

        claimCounter++;
        claimId = keccak256(abi.encodePacked(token, obligor, claimant, amount, block.timestamp, claimCounter));

        claims[claimId] = EncumbranceClaim({
            claimId: claimId,
            token: token,
            obligor: obligor,
            claimant: claimant,
            amount: amount,
            status: ClaimStatus.Active,
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });

        claimsByObligor[obligor].push(claimId);
        totalHeld[token][obligor] += amount;

        emit EncumbranceCreated(claimId, token, obligor, claimant, amount);
    }

    function releaseClaim(bytes32 claimId) external {
        EncumbranceClaim storage claim = claims[claimId];
        if (claim.claimId == 0) revert ClaimNotFound();
        if (claim.status != ClaimStatus.Active) revert InvalidClaimState();
        if (msg.sender != claim.claimant && msg.sender != owner) revert UnauthorizedAccess();

        claim.status = ClaimStatus.Released;
        claim.updatedAt = block.timestamp;
        totalHeld[claim.token][claim.obligor] -= claim.amount;

        emit EncumbranceReleased(claimId, msg.sender, block.timestamp);
    }

    function defaultClaim(bytes32 claimId) external onlyOwner {
        EncumbranceClaim storage claim = claims[claimId];
        if (claim.claimId == 0) revert ClaimNotFound();
        if (claim.status != ClaimStatus.Active) revert InvalidClaimState();

        claim.status = ClaimStatus.Defaulted;
        claim.updatedAt = block.timestamp;

        emit EncumbranceDefaulted(claimId, msg.sender, block.timestamp);
    }

    function getAvailableBalance(address token, address obligor) public view returns (uint256) {
        return tokenBalances[token][obligor] - totalHeld[token][obligor];
    }

    function getClaims(address token, address obligor)
        external
        view
        returns (EncumbranceClaim[] memory results)
    {
        bytes32[] memory ids = claimsByObligor[obligor];
        uint256 count;

        for (uint256 i = 0; i < ids.length; i++) {
            if (claims[ids[i]].token == token) {
                count++;
            }
        }

        results = new EncumbranceClaim[](count);
        uint256 index;
        for (uint256 i = 0; i < ids.length; i++) {
            if (claims[ids[i]].token == token) {
                results[index] = claims[ids[i]];
                index++;
            }
        }
    }
}

// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/**
 * @title MockHoldToken
 * @notice Minimal stand-in for an ATS diamond implementing exactly the hold lifecycle
 *         used by EncumbranceLedger, with the same semantics proven on Hedera testnet:
 *         create locks the caller's balance, execute/release are escrow-only, and the
 *         destination is unconstrained when the hold's `to` is zero.
 */
contract MockHoldToken {
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

    uint8 public decimals;
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(uint256 => Hold) public holds;
    mapping(uint256 => address) public holdOwner;
    mapping(uint256 => bool) public holdExists;
    uint256 private _holdSeq;

    event HoldCreated(uint256 indexed holdId, address indexed tokenHolder, uint256 amount, address escrow, address to);
    event HoldExecuted(uint256 indexed holdId, address indexed to, uint256 amount);
    event HoldReleased(uint256 indexed holdId, address indexed tokenHolder, uint256 amount);

    error NotEscrow();
    error InsufficientAmount();
    error HoldNotFound();

    constructor(uint8 _decimals) {
        decimals = _decimals;
    }

    function mint(address to, uint256 amount) external {
        totalSupply += amount;
        balanceOf[to] += amount;
    }

    function createHoldByPartition(bytes32, Hold memory _hold) external returns (bool, uint256) {
        if (balanceOf[msg.sender] < _hold.amount) revert InsufficientAmount();
        balanceOf[msg.sender] -= _hold.amount;
        uint256 id = ++_holdSeq;
        holds[id] = _hold;
        holdOwner[id] = msg.sender;
        holdExists[id] = true;
        emit HoldCreated(id, msg.sender, _hold.amount, _hold.escrow, _hold.to);
        return (true, id);
    }

    function executeHoldByPartition(HoldIdentifier memory ident, address to, uint256 amount)
        external
        returns (bool, bytes32)
    {
        Hold storage h = holds[ident.holdId];
        if (!holdExists[ident.holdId] || msg.sender != h.escrow) revert NotEscrow();
        if (amount > h.amount) revert InsufficientAmount();
        h.amount -= amount;
        balanceOf[to] += amount;
        emit HoldExecuted(ident.holdId, to, amount);
        return (true, ident.partition);
    }

    function releaseHoldByPartition(HoldIdentifier memory ident, uint256 amount) external returns (bool) {
        Hold storage h = holds[ident.holdId];
        if (!holdExists[ident.holdId] || msg.sender != h.escrow) revert NotEscrow();
        if (amount > h.amount) revert InsufficientAmount();
        h.amount -= amount;
        balanceOf[holdOwner[ident.holdId]] += amount;
        emit HoldReleased(ident.holdId, holdOwner[ident.holdId], amount);
        return true;
    }

    function transferByPartition(bytes32 partition, address to, uint256 amount, bytes memory) external returns (bool, bytes32) {
        if (balanceOf[msg.sender] < amount) revert InsufficientAmount();
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return (true, partition);
    }
}
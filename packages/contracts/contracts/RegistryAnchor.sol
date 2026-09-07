// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

/// @title RegistryAnchor
/// @notice On-chain anchor of the Universal Encumbrance Registry (Hypotheca).
/// Records the public HCS topic used as the registry data bus and the list of
/// tokenized asset instances (ATS diamonds) this registry enforces against.
/// The global projection lives off-chain (registry service) and is cross-checked
/// against the events mirrored from HCS; this contract is the source of truth for
/// which instances are registered and where the registry commits.
contract RegistryAnchor {
    struct Instance {
        bytes32 platformId;
        string operator;
        uint256 assetDiamondEntity;
        address assetEvm;
        string assetName;
        string assetSymbol;
        uint8 assetDecimals;
        uint256 faceValue; // declared total tokenized face value (base units)
        uint256 maturityTs;
        bool active;
    }

    address public owner;
    uint256 public topicEntity; // Hedera topic id (entity, shard 0 realm 0)
    uint256 public instanceCount;
    mapping(bytes32 => Instance) internal _instances;
    mapping(bytes32 => bool) internal _registered;
    bytes32[] internal _platformKeys;

    event TopicUpdated(uint256 indexed topicEntity);
    event InstanceRegistered(bytes32 indexed platformId, address indexed assetEvm, string symbol, uint256 faceValue);
    event InstanceRemoved(bytes32 indexed platformId);
    event FaceValueUpdated(bytes32 indexed platformId, uint256 faceValue);

    error OnlyOwner();
    error NotRegistered(bytes32 platformId);
    error AlreadyRegistered(bytes32 platformId);
    error InvalidAddress();

    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function transferOwnership(address nextOwner) external onlyOwner {
        if (nextOwner == address(0)) revert InvalidAddress();
        owner = nextOwner;
    }

    function updateTopic(uint256 topicEntity_) external onlyOwner {
        require(topicEntity_ > 0, "topic required");
        topicEntity = topicEntity_;
        emit TopicUpdated(topicEntity_);
    }

    function registerInstance(
        bytes32 platformId_,
        string calldata operator_,
        uint256 assetDiamondEntity_,
        address assetEvm_,
        string calldata assetName_,
        string calldata assetSymbol_,
        uint8 assetDecimals_,
        uint256 faceValue_,
        uint256 maturityTs_
    ) external onlyOwner {
        if (assetEvm_ == address(0)) revert InvalidAddress();
        if (_registered[platformId_]) revert AlreadyRegistered(platformId_);
        require(assetDiamondEntity_ > 0, "asset entity required");
        _instances[platformId_] = Instance({
            platformId: platformId_,
            operator: operator_,
            assetDiamondEntity: assetDiamondEntity_,
            assetEvm: assetEvm_,
            assetName: assetName_,
            assetSymbol: assetSymbol_,
            assetDecimals: assetDecimals_,
            faceValue: faceValue_,
            maturityTs: maturityTs_,
            active: true
        });
        _registered[platformId_] = true;
        _platformKeys.push(platformId_);
        ++instanceCount;
        emit InstanceRegistered(platformId_, assetEvm_, assetSymbol_, faceValue_);
    }

    function unregisterInstance(bytes32 platformId_) external onlyOwner {
        if (!_registered[platformId_]) revert NotRegistered(platformId_);
        _instances[platformId_].active = false;
        --instanceCount;
        emit InstanceRemoved(platformId_);
    }

    function updateFaceValue(bytes32 platformId_, uint256 faceValue_) external onlyOwner {
        if (!_registered[platformId_]) revert NotRegistered(platformId_);
        _instances[platformId_].faceValue = faceValue_;
        emit FaceValueUpdated(platformId_, faceValue_);
    }

    function getInstance(bytes32 platformId_) external view returns (Instance memory) {
        if (!_registered[platformId_]) revert NotRegistered(platformId_);
        return _instances[platformId_];
    }

    function getInstances() external view returns (Instance[] memory) {
        Instance[] memory list = new Instance[](instanceCount);
        uint256 cursor;
        uint256 len = _platformKeys.length;
        for (uint256 i; i < len; ++i) {
            Instance storage inst = _instances[_platformKeys[i]];
            if (!inst.active) continue;
            list[cursor] = inst;
            ++cursor;
        }
        return list;
    }

    function isRegistered(bytes32 platformId_) external view returns (bool) {
        return _registered[platformId_];
    }
}
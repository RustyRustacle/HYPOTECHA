// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/**
 * @notice Minimal Chainlink-style aggregator for local unit tests.
 *         `setAnswer` refreshes `updatedAt` so the staleness guard stays off;
 *         `hackUpdatedAt` lets tests force the StalePrice path.
 */
contract MockFeed {
    uint8 public decimals;
    int256 public answer;
    uint80 public roundId;
    uint256 public updatedAt;

    constructor(uint8 _decimals, int256 _initial) {
        decimals = _decimals;
        answer = _initial;
        roundId = 1;
        updatedAt = block.timestamp;
    }

    function setAnswer(int256 a) external {
        answer = a;
        roundId++;
        updatedAt = block.timestamp;
    }

    function hackUpdatedAt(uint256 ts) external {
        updatedAt = ts;
    }

    function latestRoundData()
        external
        view
        returns (uint80, int256, uint256, uint256, uint80)
    {
        return (roundId, answer, block.timestamp, updatedAt, roundId);
    }
}
```solidity
// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {ERC20Votes} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Nonces} from "@openzeppelin/contracts/utils/Nonces.sol";

/// @title FableToken
/// @notice ERC-20 token with staking, voting delegation, and burn functionality for Fablechain
/// @dev Combines ERC20, voting rights, permit functionality, and staking mechanics
contract FableToken is ERC20, ERC20Burnable, ERC20Votes, ERC20Permit, Ownable {
    /// @notice Maximum supply cap of FABLE tokens (1 billion with 18 decimals)
    uint256 public constant MAX_SUPPLY = 1_000_000_000e18;

    /// @notice Minimum staking duration in seconds (30 days)
    uint256 public constant MIN_STAKE_DURATION = 30 days;

    /// @notice Maximum staking duration in seconds (4 years)
    uint256 public constant MAX_STAKE_DURATION = 4 * 365 days;

    /// @notice Base staking reward rate (in basis points, 1% = 100)
    uint256 public baseRewardRate = 500; // 5% annually

    /// @notice Governance timelock delay for critical operations
    uint256 public governanceDelay = 2 days;

    /// @notice Staking structure for individual stake records
    struct Stake {
        uint256 amount;
        uint256 lockTime;
        uint256 unlockTime;
        uint256 rewardDebt;
        bool claimed;
    }

    /// @notice Mapping of staker address to their stakes
    mapping(address => Stake[]) public stakes;

    /// @notice Total amount of tokens currently staked
    uint256 public totalStaked;

    /// @notice Accumulated reward pool
    uint256 public rewardPool;

    /// @notice Pending governance actions
    mapping(bytes32 => uint256) public pendingActions;

    /// @notice Events
    event Staked(address indexed staker, uint256 amount, uint256 unlockTime);
    event Unstaked(address indexed staker, uint256 stakeIndex, uint256 amount, uint256 reward);
    event RewardClaimed(address indexed staker, uint256 reward);
    event RewardRateUpdated(uint256 oldRate, uint256 newRate);
    event RewardPoolFunded(address indexed funder, uint256 amount);
    event GovernanceActionScheduled(bytes32 indexed actionHash, uint256 executionTime);
    event GovernanceActionExecuted(bytes32 indexed actionHash);

    /// @notice Custom errors for gas-efficient reverts
    error ExceedsMaxSupply();
    error InvalidStakeDuration();
    error NoStakesFound();
    error StakeStillLocked();
    error InvalidRewardRate();
    error InsufficientRewardPool();
    error GovernanceActionPending();
    error GovernanceActionNotReady();

    constructor() ERC20("Fable", "FABLE") ERC20Permit("Fable") Ownable(msg.sender) {
        _mint(msg.sender, 100_000_000e18);
        rewardPool = 50_000_000e18;
    }

    /// @notice Mint new FABLE tokens (only owner, respects max supply)
    /// @param to Recipient address
    /// @param amount Amount to mint in wei
    function mint(address to, uint256 amount) public onlyOwner {
        if (totalSupply() + amount > MAX_SUPPLY) {
            revert ExceedsMaxSupply();
        }
        _mint(to, amount);
    }

    /// @notice Stake tokens for a specified duration
    /// @param amount Amount of tokens to stake
    /// @param duration Lock duration in seconds (must be between MIN and MAX)
    function stake(uint256 amount, uint256 duration) external {
        if (duration < MIN_STAKE_DURATION || duration > MAX_STAKE_DURATION) {
            revert InvalidStakeDuration();
        }

        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        require(amount > 0, "Stake amount must be greater than 0");

        uint256 unlockTime = block.timestamp + duration;
        uint256 reward = _calculateReward(amount, duration);

        if (rewardPool < reward) {
            revert InsufficientRewardPool();
        }

        _transfer(msg.sender, address(this), amount);
        totalStaked += amount;
        rewardPool -= reward;

        stakes[msg.sender].push(Stake({
            amount: amount,
            lockTime: block.timestamp,
            unlockTime: unlockTime,
            rewardDebt: reward,
            claimed: false
        }));

        emit Staked(msg.sender, amount, unlockTime);
    }

    /// @notice Unstake tokens and claim rewards
    /// @param stakeIndex Index of the stake to unstake
    function unstake(uint256 stakeIndex) external {
        require(stakeIndex < stakes[msg.sender].length, "Invalid stake index");

        Stake storage userStake = stakes[msg.sender][stakeIndex];

        if (block.timestamp < userStake.unlockTime) {
            revert StakeStillLocked();
        }

        require(!userStake.claimed, "Stake already claimed");

        uint256 amount = userStake.amount;
        uint256 reward = userStake.rewardDebt;

        userStake.claimed = true;
        totalStaked -= amount;

        _transfer(address(this), msg.sender, amount);

        if (reward > 0) {
            if (totalSupply() + reward > MAX_SUPPLY) {
                _transfer(address(this), msg.sender, reward);
            } else {
                _mint(msg.sender, reward);
            }
        }

        emit Unstaked(msg.sender, stakeIndex, amount, reward);
    }

    /// @notice Get all stakes for an address
    /// @param staker Address to query
    /// @return Array of stakes for the given staker
    function getStakes(address staker) external view returns (Stake[] memory) {
        return stakes[staker];
    }

    /// @notice Get number of stakes for an address
    /// @param staker Address to query
    /// @return Count of stakes
    function getStakeCount(address staker) external view returns (uint256) {
        return stakes[staker].length;
    }

    /// @notice Calculate staking reward based on amount and duration
    /// @param amount Token amount being staked
    /// @param duration Lock duration in seconds
    /// @return Calculated reward amount
    function _calculateReward(uint256 amount, uint256 duration) internal view returns (uint256) {
        uint256 annualReward = (amount * baseRewardRate) / 10000;
        return (annualReward * duration) / 365 days;
    }

    /// @notice Update base reward rate (governance protected)
    /// @param newRate New reward rate in basis points
    function scheduleRewardRateUpdate(uint256 newRate) external onlyOwner {
        if (newRate > 2000) {
            revert InvalidRewardRate();
        }

        bytes32 actionHash = keccak256(abi.encodePacked("updateRewardRate", newRate));
        pendingActions[actionHash] = block.timestamp + governanceDelay;

        emit GovernanceActionScheduled(actionHash, block.timestamp + governanceDelay);
    }

    /// @notice Execute scheduled reward rate update
    /// @param newRate New reward rate in basis points
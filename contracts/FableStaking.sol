```solidity
// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/// @title FableStaking
/// @notice A staking contract for FABLE tokens with 14-day unbonding period and reward distribution
/// @dev Implements stake, unstake, claim rewards, and slash functionality
contract FableStaking is ReentrancyGuard, Ownable, Pausable {
    
    IERC20 public fableToken;
    
    uint256 public constant UNBONDING_PERIOD = 14 days;
    uint256 public constant MAX_SLASH_PERCENTAGE = 10000; // 100.00%
    uint256 public rewardRate = 100; // 1% per year (10000 = 100%)
    uint256 public totalStaked;
    uint256 public totalRewardsPool;
    
    struct StakePosition {
        uint256 amount;
        uint256 stakedAt;
        uint256 lastRewardClaim;
        uint256 accumulatedRewards;
    }
    
    struct UnbondingPosition {
        uint256 amount;
        uint256 unbondingStartTime;
    }
    
    mapping(address => StakePosition) public stakes;
    mapping(address => UnbondingPosition[]) public unbondings;
    mapping(address => bool) public slashers;
    
    event Staked(address indexed staker, uint256 amount, uint256 timestamp);
    event UnstakeInitiated(address indexed staker, uint256 amount, uint256 unbondingTime);
    event Unstaked(address indexed staker, uint256 amount, uint256 timestamp);
    event RewardsClaimed(address indexed staker, uint256 rewardAmount, uint256 timestamp);
    event RewardsDeposited(address indexed depositor, uint256 amount, uint256 timestamp);
    event Slashed(address indexed slashedStaker, uint256 slashAmount, uint256 slashPercentage, address indexed slasher);
    event RewardRateUpdated(uint256 newRate, uint256 timestamp);
    event SlasherAdded(address indexed slasher, uint256 timestamp);
    event SlasherRemoved(address indexed slasher, uint256 timestamp);
    
    modifier onlySlasher() {
        require(slashers[msg.sender], "FableStaking: caller is not a slasher");
        _;
    }
    
    constructor(address _fableToken) {
        require(_fableToken != address(0), "FableStaking: invalid token address");
        fableToken = IERC20(_fableToken);
        slashers[msg.sender] = true;
    }
    
    /// @notice Stake FABLE tokens
    /// @param _amount The amount of tokens to stake
    function stake(uint256 _amount) external nonReentrant whenNotPaused {
        require(_amount > 0, "FableStaking: stake amount must be greater than 0");
        require(
            fableToken.transferFrom(msg.sender, address(this), _amount),
            "FableStaking: transfer failed"
        );
        
        // Claim pending rewards if staker has existing position
        if (stakes[msg.sender].amount > 0) {
            _claimRewards();
        }
        
        stakes[msg.sender].amount += _amount;
        stakes[msg.sender].stakedAt = block.timestamp;
        if (stakes[msg.sender].lastRewardClaim == 0) {
            stakes[msg.sender].lastRewardClaim = block.timestamp;
        }
        
        totalStaked += _amount;
        
        emit Staked(msg.sender, _amount, block.timestamp);
    }
    
    /// @notice Initiate unstaking process with 14-day unbonding period
    /// @param _amount The amount of tokens to unstake
    function unstakeInitiate(uint256 _amount) external nonReentrant {
        require(_amount > 0, "FableStaking: unstake amount must be greater than 0");
        require(stakes[msg.sender].amount >= _amount, "FableStaking: insufficient staked balance");
        
        // Claim pending rewards before unstaking
        _claimRewards();
        
        stakes[msg.sender].amount -= _amount;
        totalStaked -= _amount;
        
        unbondings[msg.sender].push(UnbondingPosition({
            amount: _amount,
            unbondingStartTime: block.timestamp
        }));
        
        emit UnstakeInitiated(msg.sender, _amount, block.timestamp + UNBONDING_PERIOD);
    }
    
    /// @notice Complete unstaking after unbonding period has passed
    /// @param _unbondingIndex The index of the unbonding position to complete
    function unstakeComplete(uint256 _unbondingIndex) external nonReentrant {
        require(_unbondingIndex < unbondings[msg.sender].length, "FableStaking: invalid unbonding index");
        
        UnbondingPosition storage unbonding = unbondings[msg.sender][_unbondingIndex];
        require(
            block.timestamp >= unbonding.unbondingStartTime + UNBONDING_PERIOD,
            "FableStaking: unbonding period not complete"
        );
        
        uint256 amount = unbonding.amount;
        
        // Remove the unbonding position
        unbondings[msg.sender][_unbondingIndex] = unbondings[msg.sender][unbondings[msg.sender].length - 1];
        unbondings[msg.sender].pop();
        
        require(fableToken.transfer(msg.sender, amount), "FableStaking: transfer failed");
        
        emit Unstaked(msg.sender, amount, block.timestamp);
    }
    
    /// @notice Calculate pending rewards for a staker
    /// @param _staker The address to calculate rewards for
    /// @return The amount of pending rewards
    function getPendingRewards(address _staker) public view returns (uint256) {
        StakePosition memory position = stakes[_staker];
        if (position.amount == 0) {
            return position.accumulatedRewards;
        }
        
        uint256 timeSinceLastClaim = block.timestamp - position.lastRewardClaim;
        uint256 rewardAmount = (position.amount * rewardRate * timeSinceLastClaim) / (365 days * 10000);
        
        return position.accumulatedRewards + rewardAmount;
    }
    
    /// @notice Claim accumulated rewards
    function claimRewards() external nonReentrant whenNotPaused {
        _claimRewards();
    }
    
    /// @dev Internal function to claim rewards
    function _claimRewards() internal {
        require(stakes[msg.sender].amount > 0, "FableStaking: no stake found");
        
        uint256 rewards = getPendingRewards(msg.sender);
        require(rewards > 0, "FableStaking: no rewards to claim");
        require(rewards <= totalRewardsPool, "FableStaking: insufficient reward pool");
        
        stakes[msg.sender].accumulatedRewards = 0;
        stakes[msg.sender].lastRewardClaim = block.timestamp;
        totalRewardsPool -= rewards;
        
        require(fableToken.transfer(msg.sender, rewards), "FableStaking: reward transfer failed");
        
        emit RewardsClaimed(msg.sender, rewards, block.timestamp);
    }
    
    /// @notice Deposit tokens into the reward pool
    /// @param _amount The amount of tokens to deposit as rewards
    function depositRewards(uint256 _amount) external nonReentrant {
        require(_amount > 0, "FableStaking: deposit amount must be greater than 0");
        require(
            fableToken.transferFrom(msg.sender, address(this), _amount),
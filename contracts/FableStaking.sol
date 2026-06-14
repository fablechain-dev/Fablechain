```solidity
// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/// @title FableStaking
/// @notice Staking contract for FABLE token with 14-day unbonding period
/// @dev Implements stake, unstake, slash, and reward claiming mechanisms
contract FableStaking is ReentrancyGuard, Ownable, Pausable {
    IERC20 public fableToken;

    uint256 public constant UNBONDING_PERIOD = 14 days;
    uint256 public constant SLASH_DENOMINATOR = 10000;

    uint256 public totalStaked;
    uint256 public rewardsPerSecond;
    uint256 public lastRewardTime;
    uint256 public accumulatedRewardsPerShare;

    mapping(address => uint256) public stakedBalance;
    mapping(address => uint256) public rewardDebt;
    mapping(address => UnbondingRequest[]) public unbondingRequests;
    mapping(address => bool) public slashers;

    struct UnbondingRequest {
        uint256 amount;
        uint256 unlockTime;
    }

    event Staked(address indexed user, uint256 amount);
    event UnstakeInitiated(address indexed user, uint256 amount, uint256 unlockTime);
    event Unstaked(address indexed user, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 amount);
    event Slashed(address indexed user, uint256 amount, uint256 percentage);
    event RewardsPerSecondUpdated(uint256 newRate);
    event SlasherAdded(address indexed slasher);
    event SlasherRemoved(address indexed slasher);

    modifier onlySlasher() {
        require(slashers[msg.sender] || msg.sender == owner(), "Not authorized to slash");
        _;
    }

    constructor(address _fableToken, uint256 _rewardsPerSecond) {
        require(_fableToken != address(0), "Invalid token address");
        fableToken = IERC20(_fableToken);
        rewardsPerSecond = _rewardsPerSecond;
        lastRewardTime = block.timestamp;
        accumulatedRewardsPerShare = 0;
    }

    /// @notice Stake FABLE tokens
    /// @param _amount Amount of FABLE tokens to stake
    function stake(uint256 _amount) external nonReentrant whenNotPaused {
        require(_amount > 0, "Stake amount must be greater than zero");
        require(
            fableToken.transferFrom(msg.sender, address(this), _amount),
            "Token transfer failed"
        );

        updateRewards();

        if (stakedBalance[msg.sender] > 0) {
            uint256 pending = (stakedBalance[msg.sender] * accumulatedRewardsPerShare) / 1e18 - rewardDebt[msg.sender];
            if (pending > 0) {
                rewardDebt[msg.sender] += pending;
            }
        }

        stakedBalance[msg.sender] += _amount;
        totalStaked += _amount;
        rewardDebt[msg.sender] = (stakedBalance[msg.sender] * accumulatedRewardsPerShare) / 1e18;

        emit Staked(msg.sender, _amount);
    }

    /// @notice Initiate unstaking with 14-day unbonding period
    /// @param _amount Amount of FABLE tokens to unstake
    function initiateUnstake(uint256 _amount) external nonReentrant {
        require(_amount > 0, "Unstake amount must be greater than zero");
        require(stakedBalance[msg.sender] >= _amount, "Insufficient staked balance");

        updateRewards();

        uint256 pending = (stakedBalance[msg.sender] * accumulatedRewardsPerShare) / 1e18 - rewardDebt[msg.sender];
        if (pending > 0) {
            rewardDebt[msg.sender] += pending;
        }

        stakedBalance[msg.sender] -= _amount;
        totalStaked -= _amount;
        rewardDebt[msg.sender] = (stakedBalance[msg.sender] * accumulatedRewardsPerShare) / 1e18;

        uint256 unlockTime = block.timestamp + UNBONDING_PERIOD;
        unbondingRequests[msg.sender].push(
            UnbondingRequest({amount: _amount, unlockTime: unlockTime})
        );

        emit UnstakeInitiated(msg.sender, _amount, unlockTime);
    }

    /// @notice Complete unstaking after unbonding period
    function completeUnstake() external nonReentrant {
        UnbondingRequest[] storage requests = unbondingRequests[msg.sender];
        require(requests.length > 0, "No unstaking requests");

        uint256 totalUnstaked = 0;
        uint256 requestsToRemove = 0;

        for (uint256 i = 0; i < requests.length; i++) {
            if (block.timestamp >= requests[i].unlockTime) {
                totalUnstaked += requests[i].amount;
                requestsToRemove++;
            } else {
                break;
            }
        }

        require(totalUnstaked > 0, "No requests ready to unstake");

        for (uint256 i = 0; i < requestsToRemove; i++) {
            requests.pop();
        }

        require(fableToken.transfer(msg.sender, totalUnstaked), "Token transfer failed");

        emit Unstaked(msg.sender, totalUnstaked);
    }

    /// @notice Claim accumulated rewards
    function claimRewards() external nonReentrant whenNotPaused {
        updateRewards();

        uint256 pending = (stakedBalance[msg.sender] * accumulatedRewardsPerShare) / 1e18 - rewardDebt[msg.sender];
        require(pending > 0, "No rewards to claim");

        rewardDebt[msg.sender] = (stakedBalance[msg.sender] * accumulatedRewardsPerShare) / 1e18;

        require(fableToken.transfer(msg.sender, pending), "Reward transfer failed");

        emit RewardsClaimed(msg.sender, pending);
    }

    /// @notice Slash a staker's balance
    /// @param _user Address of the user to slash
    /// @param _slashPercentage Percentage to slash (in basis points, e.g., 1000 = 10%)
    function slash(address _user, uint256 _slashPercentage) external onlySlasher nonReentrant {
        require(_user != address(0), "Invalid user address");
        require(_slashPercentage > 0 && _slashPercentage <= SLASH_DENOMINATOR, "Invalid slash percentage");
        require(stakedBalance[_user] > 0, "User has no staked balance");

        updateRewards();

        uint256 slashAmount = (stakedBalance[_user] * _slashPercentage) / SLASH_DENOMINATOR;
        require(slashAmount > 0, "Slash amount must be greater than zero");

        stakedBalance[_user] -= slashAmount;
        totalStaked -= slashAmount;

        uint256 rewardDebtReduction = (slashAmount * accumulatedRewardsPerShare) / 1e18;
        if (rewardDebt[_user] > rewardDebtReduction) {
            rewardDebt[_user] -= rewardDebtReduction;
        } else {
            rewardDebt[_user] = 0;
        }

        emit Slashed(_user, slashAmount, _slashPercentage);
    }

    /// @notice Update rewards accumulation
    function updateRewards() public {
        if (block.timestamp
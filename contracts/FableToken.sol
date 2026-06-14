```solidity
// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Snapshot.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

/// @title FABLE Token Contract
/// @notice ERC-20 token with minting, burning, staking locks, and governance delegation
/// @dev Combines multiple ERC20 extensions for a complete governance token
contract FableToken is
    ERC20,
    ERC20Burnable,
    ERC20Snapshot,
    Ownable,
    Pausable,
    ERC20Votes,
    ERC20Permit
{
    /// @notice Maximum supply cap for the token
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10 ** 18;

    /// @notice Minting role flag
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    /// @notice Staking lock structure for governance participation
    struct StakeLock {
        uint256 amount;
        uint256 unlockTime;
        bool active;
    }

    /// @notice Maps user address to their staking locks
    mapping(address => StakeLock[]) public stakeLocks;

    /// @notice Maps address to minting permissions
    mapping(address => bool) public minters;

    /// @notice Total locked tokens across all accounts
    uint256 public totalLockedTokens;

    /// @notice Minimum lock duration in seconds
    uint256 public constant MIN_LOCK_DURATION = 7 days;

    /// @notice Maximum lock duration in seconds
    uint256 public constant MAX_LOCK_DURATION = 4 * 365 days;

    /// @notice Emitted when tokens are locked for staking
    event TokensLocked(
        indexed user,
        uint256 amount,
        uint256 unlockTime,
        uint256 lockIndex
    );

    /// @notice Emitted when staked tokens are unlocked
    event TokensUnlocked(indexed user, uint256 amount, uint256 lockIndex);

    /// @notice Emitted when minter role is granted
    event MinterGranted(indexed account);

    /// @notice Emitted when minter role is revoked
    event MinterRevoked(indexed account);

    /// @notice Emitted when snapshot is taken
    event Snapshot(uint256 indexed snapshotId);

    /// @notice Only allows accounts with minter role to call function
    modifier onlyMinter() {
        require(minters[msg.sender], "FableToken: caller is not a minter");
        _;
    }

    /// @notice Constructor initializes the token with initial supply
    /// @param initialSupply The initial token supply to mint to deployer
    constructor(uint256 initialSupply)
        ERC20("Fable", "FABLE")
        ERC20Permit("Fable")
    {
        require(
            initialSupply <= MAX_SUPPLY,
            "FableToken: initial supply exceeds max supply"
        );
        _mint(msg.sender, initialSupply);
        minters[msg.sender] = true;
    }

    /// @notice Grants minter role to an account
    /// @param account The account to grant minter role
    function grantMinter(address account) external onlyOwner {
        require(account != address(0), "FableToken: invalid address");
        require(!minters[account], "FableToken: account already has minter role");
        minters[account] = true;
        emit MinterGranted(account);
    }

    /// @notice Revokes minter role from an account
    /// @param account The account to revoke minter role from
    function revokeMinter(address account) external onlyOwner {
        require(minters[account], "FableToken: account does not have minter role");
        minters[account] = false;
        emit MinterRevoked(account);
    }

    /// @notice Mints new tokens to a specified account
    /// @param to The recipient address
    /// @param amount The amount of tokens to mint
    function mint(address to, uint256 amount) external onlyMinter {
        require(to != address(0), "FableToken: mint to zero address");
        require(
            totalSupply() + amount <= MAX_SUPPLY,
            "FableToken: minting would exceed max supply"
        );
        _mint(to, amount);
    }

    /// @notice Locks tokens for staking and governance participation
    /// @param amount The amount of tokens to lock
    /// @param lockDuration The duration to lock tokens in seconds
    /// @return lockIndex The index of the created lock
    function lockTokens(uint256 amount, uint256 lockDuration)
        external
        returns (uint256 lockIndex)
    {
        require(amount > 0, "FableToken: lock amount must be greater than zero");
        require(
            lockDuration >= MIN_LOCK_DURATION,
            "FableToken: lock duration too short"
        );
        require(
            lockDuration <= MAX_LOCK_DURATION,
            "FableToken: lock duration too long"
        );
        require(
            balanceOf(msg.sender) >= amount,
            "FableToken: insufficient balance for locking"
        );

        uint256 unlockTime = block.timestamp + lockDuration;
        lockIndex = stakeLocks[msg.sender].length;

        stakeLocks[msg.sender].push(
            StakeLock({amount: amount, unlockTime: unlockTime, active: true})
        );

        totalLockedTokens += amount;

        _transfer(msg.sender, address(this), amount);

        emit TokensLocked(msg.sender, amount, unlockTime, lockIndex);
    }

    /// @notice Unlocks previously locked tokens
    /// @param lockIndex The index of the lock to unlock
    function unlockTokens(uint256 lockIndex) external {
        require(
            lockIndex < stakeLocks[msg.sender].length,
            "FableToken: invalid lock index"
        );

        StakeLock storage lock = stakeLocks[msg.sender][lockIndex];
        require(lock.active, "FableToken: lock is already inactive");
        require(
            block.timestamp >= lock.unlockTime,
            "FableToken: tokens are still locked"
        );

        uint256 amount = lock.amount;
        lock.active = false;
        totalLockedTokens -= amount;

        _transfer(address(this), msg.sender, amount);

        emit TokensUnlocked(msg.sender, amount, lockIndex);
    }

    /// @notice Gets all stake locks for a user
    /// @param user The user address to query
    /// @return Array of StakeLock structures
    function getStakeLocks(address user)
        external
        view
        returns (StakeLock[] memory)
    {
        return stakeLocks[user];
    }

    /// @notice Gets the number of locks for a user
    /// @param user The user address to query
    /// @return The count of locks
    function getStakeLockCount(address user) external view returns (uint256) {
        return stakeLocks[user].length;
    }

    /// @notice Gets total locked tokens for a user
    /// @param user The user address to query
    /// @return The total amount of locked tokens
    function getLockedBalance(address user)
        external
        view
        returns (uint256)
    {
        uint256 locked = 0;
        for (uint256 i = 0; i < stakeLocks[user].length; i++) {
            if (stakeLocks[user][i].active) {
                locked += stakeLocks[user][i].amount;
            }
        }
        return locked;
    }
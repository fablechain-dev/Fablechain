// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/// @title FableBridge
/// @notice Cross-chain bridge contract for locking and unlocking tokens with merkle proof verification
/// @dev Implements lock/unlock mechanism with support for multiple remote chains
contract FableBridge is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    /// @notice Represents a cross-chain token transfer
    struct Transfer {
        address token;
        address recipient;
        uint256 amount;
        uint256 sourceChainId;
        uint256 nonce;
        bool processed;
    }

    /// @notice Chain configuration for remote networks
    struct ChainConfig {
        bool enabled;
        uint256 minAmount;
        uint256 maxAmount;
        uint256 fee;
    }

    /// @notice Maps chain IDs to their configuration
    mapping(uint256 => ChainConfig) public chainConfigs;

    /// @notice Maps merkle root to whether it's been set for a chain
    mapping(uint256 => mapping(bytes32 => bool)) public merkleRoots;

    /// @notice Maps transfer hash to whether it's been processed
    mapping(bytes32 => bool) public processedTransfers;

    /// @notice Maps token address to whether it's supported
    mapping(address => bool) public supportedTokens;

    /// @notice Maps token to total locked amount
    mapping(address => uint256) public lockedAmounts;

    /// @notice Current nonce for transfers from this chain
    uint256 public outboundNonce;

    /// @notice Fee recipient address
    address public feeRecipient;

    /// @notice Minimum merkle root age in blocks to prevent replay attacks
    uint256 public constant MERKLE_ROOT_AGE_MIN = 10;

    uint256 private constant PRECISION = 1e18;

    // Events
    event TokenLocked(
        address indexed token,
        address indexed sender,
        uint256 amount,
        uint256 indexed destChainId,
        address recipient,
        uint256 nonce,
        uint256 fee
    );

    event TokenUnlocked(
        address indexed token,
        address indexed recipient,
        uint256 amount,
        uint256 indexed sourceChainId,
        uint256 nonce
    );

    event ChainConfigured(
        uint256 indexed chainId,
        bool enabled,
        uint256 minAmount,
        uint256 maxAmount,
        uint256 fee
    );

    event TokenSupported(address indexed token, bool supported);

    event MerkleRootSet(uint256 indexed chainId, bytes32 indexed root);

    event FeeRecipientUpdated(address indexed newRecipient);

    // Modifiers
    modifier validChain(uint256 chainId) {
        require(chainConfigs[chainId].enabled, "Chain not enabled");
        require(chainId != block.chainid, "Cannot bridge to same chain");
        _;
    }

    modifier validToken(address token) {
        require(supportedTokens[token], "Token not supported");
        require(token != address(0), "Invalid token address");
        _;
    }

    /// @notice Initialize bridge with fee recipient
    /// @param _feeRecipient Address to receive bridge fees
    constructor(address _feeRecipient) {
        require(_feeRecipient != address(0), "Invalid fee recipient");
        feeRecipient = _feeRecipient;
        outboundNonce = 1;
    }

    /// @notice Configure a remote chain
    /// @param chainId Remote chain ID
    /// @param enabled Whether chain is enabled for bridging
    /// @param minAmount Minimum transfer amount
    /// @param maxAmount Maximum transfer amount
    /// @param fee Bridge fee in basis points (1% = 100)
    function configureChain(
        uint256 chainId,
        bool enabled,
        uint256 minAmount,
        uint256 maxAmount,
        uint256 fee
    ) external onlyOwner {
        require(minAmount <= maxAmount, "Invalid amount range");
        require(fee <= 1000, "Fee too high"); // Max 10%
        require(chainId != 0, "Invalid chain ID");

        chainConfigs[chainId] = ChainConfig({
            enabled: enabled,
            minAmount: minAmount,
            maxAmount: maxAmount,
            fee: fee
        });

        emit ChainConfigured(chainId, enabled, minAmount, maxAmount, fee);
    }

    /// @notice Add or remove token support
    /// @param token Token address to configure
    /// @param supported Whether token is supported
    function setSupportedToken(address token, bool supported) external onlyOwner {
        require(token != address(0), "Invalid token");
        supportedTokens[token] = supported;
        emit TokenSupported(token, supported);
    }

    /// @notice Set merkle root for a remote chain
    /// @param chainId Source chain ID
    /// @param root Merkle root hash
    function setMerkleRoot(uint256 chainId, bytes32 root) external onlyOwner {
        require(root != bytes32(0), "Invalid root");
        merkleRoots[chainId][root] = true;
        emit MerkleRootSet(chainId, root);
    }

    /// @notice Update fee recipient address
    /// @param newRecipient New fee recipient address
    function setFeeRecipient(address newRecipient) external onlyOwner {
        require(newRecipient != address(0), "Invalid recipient");
        feeRecipient = newRecipient;
        emit FeeRecipientUpdated(newRecipient);
    }

    /// @notice Pause bridge functionality
    function pause() external onlyOwner {
        _pause();
    }

    /// @notice Unpause bridge functionality
    function unpause() external onlyOwner {
        _unpause();
    }

    /// @notice Lock tokens for transfer to remote chain
    /// @param token Token to lock
    /// @param amount Amount to lock
    /// @param destChainId Destination chain ID
    /// @param recipient Recipient address on destination chain
    /// @return nonce Transfer nonce for tracking
    function lockTokens(
        address token,
        uint256 amount,
        uint256 destChainId,
        address recipient
    )
        external
        validToken(token)
        validChain(destChainId)
        nonReentrant
        whenNotPaused
        returns (uint256 nonce)
    {
        ChainConfig memory config = chainConfigs[destChainId];
        require(amount >= config.minAmount, "Amount below minimum");
        require(amount <= config.maxAmount, "Amount exceeds maximum");
        require(recipient != address(0), "Invalid recipient");

        uint256 fee = (amount * config.fee) / 10000;
        uint256 lockedAmount = amount - fee;

        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        if (fee > 0) {
            IERC20(token).safeTransfer(feeRecipient, fee);
        }

        lockedAmounts[token] += lockedAmount;
        nonce = outboundNonce++;

        emit TokenLocked(
            token,
            msg.sender,
            lockedAmount,
            destChainId,
            recipient,
            nonce,
            fee
        );
    }

    /// @notice Unlock tokens from remote chain transfer
    /// @param token Token to unlock
    /// @param recipient Recipient address
    /// @param amount Amount to unlock
    /// @param sourceChainId Source chain ID
    /// @param nonce Transfer nonce
    /// @param merkleRoot Merkle root from source chain
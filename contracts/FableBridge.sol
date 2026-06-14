```solidity
// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

/// @title FableBridge
/// @notice Cross-chain bridge contract for locking and unlocking tokens with merkle proof verification
/// @dev Implements lock/unlock mechanism with support for multiple chains and merkle tree validation
contract FableBridge is ReentrancyGuard, Pausable, Ownable {
    using SafeERC20 for IERC20;

    /// @notice Represents a cross-chain lock event
    struct LockEvent {
        address indexed token;
        address indexed from;
        address indexed to;
        uint256 amount;
        uint256 chainId;
        uint256 nonce;
        uint256 timestamp;
    }

    /// @notice Represents a merkle root checkpoint from remote chain
    struct MerkleCheckpoint {
        bytes32 root;
        uint256 blockNumber;
        uint256 timestamp;
        bool verified;
    }

    /// @notice Mapping of chain ID to validator address
    mapping(uint256 => address) public chainValidators;

    /// @notice Mapping of chain ID to merkle root
    mapping(uint256 => bytes32) public chainMerkleRoots;

    /// @notice Mapping of chain ID to merkle checkpoints
    mapping(uint256 => mapping(bytes32 => MerkleCheckpoint)) public merkleCheckpoints;

    /// @notice Mapping of processed unlock events (hash => processed)
    mapping(bytes32 => bool) public processedUnlocks;

    /// @notice Mapping of locked amounts per token
    mapping(address => uint256) public lockedAmounts;

    /// @notice Global nonce for lock events
    uint256 public lockNonce;

    /// @notice Current chain ID
    uint256 public immutable chainId;

    /// @notice Minimum fee for cross-chain operations (in basis points)
    uint256 public feeBasisPoints = 5;

    /// @notice Fee recipient address
    address public feeRecipient;

    // Events
    event TokenLocked(
        address indexed token,
        address indexed from,
        address indexed to,
        uint256 amount,
        uint256 targetChain,
        uint256 nonce,
        bytes32 lockHash
    );

    event TokenUnlocked(
        address indexed token,
        address indexed from,
        address indexed to,
        uint256 amount,
        uint256 sourceChain,
        bytes32 unlockHash
    );

    event ValidatorRegistered(uint256 indexed chainId, address indexed validator);

    event MerkleRootUpdated(uint256 indexed chainId, bytes32 root, uint256 blockNumber);

    event FeesUpdated(uint256 newBasisPoints);

    event FeeRecipientUpdated(address indexed newRecipient);

    // Errors
    error InvalidChainId();
    error InvalidValidator();
    error InvalidProof();
    error AlreadyProcessed();
    error InsufficientBalance();
    error InvalidMerkleRoot();
    error UnauthorizedValidator();

    /// @notice Initialize the bridge contract
    constructor() {
        uint256 _chainId;
        assembly {
            _chainId := chainid()
        }
        chainId = _chainId;
        feeRecipient = msg.sender;
    }

    /// @notice Register a validator for a specific chain
    /// @param _chainId Target chain ID
    /// @param _validator Address of the validator
    function registerValidator(uint256 _chainId, address _validator) 
        external 
        onlyOwner 
    {
        if (_chainId == 0) revert InvalidChainId();
        if (_validator == address(0)) revert InvalidValidator();
        
        chainValidators[_chainId] = _validator;
        emit ValidatorRegistered(_chainId, _validator);
    }

    /// @notice Lock tokens for cross-chain transfer
    /// @param _token Address of the token to lock
    /// @param _amount Amount of tokens to lock
    /// @param _targetChain Destination chain ID
    /// @param _recipient Address on target chain
    function lockTokens(
        address _token,
        uint256 _amount,
        uint256 _targetChain,
        address _recipient
    ) 
        external 
        nonReentrant 
        whenNotPaused 
    {
        if (_token == address(0)) revert InvalidValidator();
        if (_amount == 0) revert InsufficientBalance();
        if (_targetChain == 0) revert InvalidChainId();
        if (_recipient == address(0)) revert InvalidValidator();

        uint256 balanceBefore = IERC20(_token).balanceOf(address(this));
        IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);
        uint256 balanceAfter = IERC20(_token).balanceOf(address(this));

        if (balanceAfter < balanceBefore + _amount) revert InsufficientBalance();

        lockedAmounts[_token] += _amount;
        lockNonce++;

        bytes32 lockHash = keccak256(
            abi.encodePacked(
                _token,
                msg.sender,
                _recipient,
                _amount,
                _targetChain,
                lockNonce,
                block.timestamp
            )
        );

        emit TokenLocked(
            _token,
            msg.sender,
            _recipient,
            _amount,
            _targetChain,
            lockNonce,
            lockHash
        );
    }

    /// @notice Update merkle root from remote chain validator
    /// @param _chainId Source chain ID
    /// @param _root New merkle root
    function updateMerkleRoot(
        uint256 _chainId,
        bytes32 _root
    ) 
        external 
    {
        address validator = chainValidators[_chainId];
        if (validator == address(0)) revert InvalidValidator();
        if (msg.sender != validator) revert UnauthorizedValidator();

        chainMerkleRoots[_chainId] = _root;
        
        MerkleCheckpoint storage checkpoint = merkleCheckpoints[_chainId][_root];
        checkpoint.root = _root;
        checkpoint.blockNumber = block.number;
        checkpoint.timestamp = block.timestamp;
        checkpoint.verified = true;

        emit MerkleRootUpdated(_chainId, _root, block.number);
    }

    /// @notice Unlock tokens using merkle proof from remote chain
    /// @param _token Address of the token to unlock
    /// @param _from Original sender on remote chain
    /// @param _to Recipient on this chain
    /// @param _amount Amount to unlock
    /// @param _sourceChain Source chain ID
    /// @param _proof Merkle proof array
    /// @param _leafHash Leaf hash from merkle tree
    function unlockTokens(
        address _token,
        address _from,
        address _to,
        uint256 _amount,
        uint256 _sourceChain,
        bytes32[] calldata _proof,
        bytes32 _leafHash
    ) 
        external 
        nonReentrant 
        whenNotPaused 
    {
        if (_token == address(0)) revert InvalidValidator();
        if (_to == address(0)) revert InvalidValidator();
        if (_amount == 0) revert InsufficientBalance();
        if (_sourceChain == 0) revert InvalidChainId();

        bytes32 unlockHash = keccak256(
            abi.encodePacked(_token, _from, _to, _amount, _sourceChain)
        );

        if (processedUnlocks[unlockHash]) revert AlreadyProcessed();

        bytes32 merkleRoot = chainMerkle
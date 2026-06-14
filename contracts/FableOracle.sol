```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/// @title FableOracle
/// @notice Decentralized price oracle that aggregates data from multiple sources and computes median price
/// @dev Implements staleness checking and source management for robust price feeds
contract FableOracle is Ownable, ReentrancyGuard {
    
    /// @notice Structure to store price data from a source
    struct PriceData {
        uint256 price;
        uint256 timestamp;
        uint8 decimals;
    }

    /// @notice Structure to store oracle source configuration
    struct OracleSource {
        address provider;
        bool active;
        uint256 lastUpdate;
        uint256 weight;
    }

    /// @notice Mapping of asset symbols to their price data
    mapping(bytes32 => PriceData) public assetPrices;
    
    /// @notice Mapping of asset to array of oracle sources
    mapping(bytes32 => OracleSource[]) public oracleSources;
    
    /// @notice Mapping to track source indices for quick removal
    mapping(bytes32 => mapping(address => uint256)) private sourceIndices;

    /// @notice Maximum staleness period in seconds (default: 1 hour)
    uint256 public maxStaleness = 3600;
    
    /// @notice Minimum number of sources required for price computation
    uint256 public minSourceCount = 3;
    
    /// @notice Precision multiplier for decimal handling
    uint256 private constant PRECISION = 1e18;

    /// @notice Emitted when a price is updated
    event PriceUpdated(
        bytes32 indexed asset,
        uint256 price,
        uint256 timestamp,
        uint8 decimals
    );

    /// @notice Emitted when an oracle source is added
    event SourceAdded(
        bytes32 indexed asset,
        address indexed provider,
        uint256 weight
    );

    /// @notice Emitted when an oracle source is removed
    event SourceRemoved(
        bytes32 indexed asset,
        address indexed provider
    );

    /// @notice Emitted when an oracle source is deactivated
    event SourceDeactivated(
        bytes32 indexed asset,
        address indexed provider
    );

    /// @notice Emitted when configuration changes
    event ConfigurationUpdated(
        uint256 maxStaleness,
        uint256 minSourceCount
    );

    /// @custom:error PriceStale Price data is too old
    error PriceStale();
    
    /// @custom:error InsufficientSources Not enough active oracle sources
    error InsufficientSources();
    
    /// @custom:error InvalidInput Invalid input parameters
    error InvalidInput();
    
    /// @custom:error UnauthorizedSource Caller is not authorized as oracle source
    error UnauthorizedSource();

    modifier onlyActiveSource(bytes32 asset) {
        bool isActive = false;
        OracleSource[] storage sources = oracleSources[asset];
        
        for (uint256 i = 0; i < sources.length; i++) {
            if (sources[i].provider == msg.sender && sources[i].active) {
                isActive = true;
                break;
            }
        }
        
        if (!isActive) revert UnauthorizedSource();
        _;
    }

    /// @notice Initialize oracle with configuration
    /// @param _maxStaleness Maximum allowed price age in seconds
    /// @param _minSourceCount Minimum number of sources required
    constructor(uint256 _maxStaleness, uint256 _minSourceCount) {
        if (_maxStaleness == 0 || _minSourceCount == 0) revert InvalidInput();
        maxStaleness = _maxStaleness;
        minSourceCount = _minSourceCount;
    }

    /// @notice Add an oracle source for a specific asset
    /// @param asset Asset identifier (e.g., keccak256("ETH/USD"))
    /// @param provider Address of the data provider
    /// @param weight Importance weight of this source (1-100)
    function addSource(
        bytes32 asset,
        address provider,
        uint256 weight
    ) external onlyOwner {
        if (provider == address(0) || weight == 0 || weight > 100) {
            revert InvalidInput();
        }

        OracleSource[] storage sources = oracleSources[asset];
        
        // Check if source already exists
        for (uint256 i = 0; i < sources.length; i++) {
            if (sources[i].provider == provider) {
                sources[i].weight = weight;
                sources[i].active = true;
                emit SourceAdded(asset, provider, weight);
                return;
            }
        }

        // Add new source
        sourceIndices[asset][provider] = sources.length;
        sources.push(OracleSource({
            provider: provider,
            active: true,
            lastUpdate: 0,
            weight: weight
        }));

        emit SourceAdded(asset, provider, weight);
    }

    /// @notice Remove an oracle source for a specific asset
    /// @param asset Asset identifier
    /// @param provider Address of the data provider to remove
    function removeSource(bytes32 asset, address provider) external onlyOwner {
        OracleSource[] storage sources = oracleSources[asset];
        uint256 index = sourceIndices[asset][provider];

        if (index >= sources.length || sources[index].provider != provider) {
            revert InvalidInput();
        }

        // Swap with last element and pop
        sources[index] = sources[sources.length - 1];
        sourceIndices[asset][sources[index].provider] = index;
        sources.pop();

        delete sourceIndices[asset][provider];
        emit SourceRemoved(asset, provider);
    }

    /// @notice Deactivate an oracle source (soft removal)
    /// @param asset Asset identifier
    /// @param provider Address of the data provider
    function deactivateSource(bytes32 asset, address provider) external onlyOwner {
        OracleSource[] storage sources = oracleSources[asset];
        
        for (uint256 i = 0; i < sources.length; i++) {
            if (sources[i].provider == provider) {
                sources[i].active = false;
                emit SourceDeactivated(asset, provider);
                return;
            }
        }
        
        revert InvalidInput();
    }

    /// @notice Submit price data from an authorized oracle source
    /// @param asset Asset identifier
    /// @param price Price value
    /// @param decimals Number of decimal places
    function submitPrice(
        bytes32 asset,
        uint256 price,
        uint8 decimals
    ) external onlyActiveSource(asset) nonReentrant {
        if (price == 0 || decimals > 18) revert InvalidInput();

        // Update source timestamp
        OracleSource[] storage sources = oracleSources[asset];
        for (uint256 i = 0; i < sources.length; i++) {
            if (sources[i].provider == msg.sender) {
                sources[i].lastUpdate = block.timestamp;
                break;
            }
        }

        // Compute and update median price
        _updateMedianPrice(asset, decimals);
    }

    /// @notice Internal function to compute median price from active sources
    /// @param asset Asset identifier
    /// @param decimals Number of decimal places
    function _updateMedianPrice(bytes32 asset, uint8 decimals) internal {
        OracleSource[] storage sources = oracleSources[asset];
        uint256[] memory prices = new uint256[](sources.length);
        uint256 activeCount = 0;
        uint256 totalWeight = 0;

        // Collect prices from active sources
        for (uint256 i = 0; i < sources.length; i++) {
            if (!sources[i].active) continue;
            
            // Check staleness
            if (block.timestamp - sources[i].lastUpdate > maxStaleness) {
                continue;
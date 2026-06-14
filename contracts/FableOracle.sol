```solidity
// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/// @title FableOracle
/// @notice Aggregates price data from multiple sources with median computation and staleness validation
/// @dev Uses sorted array median for robustness against outliers and manipulation
contract FableOracle is Ownable, ReentrancyGuard {
    /// @notice Maximum allowed age of price data before considered stale
    uint256 public constant STALENESS_THRESHOLD = 1 hours;

    /// @notice Minimum number of sources required for valid price
    uint256 public constant MINIMUM_SOURCES = 3;

    /// @notice Decimal precision for prices
    uint8 public constant PRICE_DECIMALS = 8;

    /// @notice Structure for price source submissions
    struct PriceSource {
        address provider;
        uint256 price;
        uint256 timestamp;
        bool active;
    }

    /// @notice Structure for aggregated price data
    struct AggregatedPrice {
        uint256 medianPrice;
        uint256 meanPrice;
        uint256 lastUpdated;
        uint256 sourceCount;
    }

    /// @notice Mapping of asset symbols to their price sources
    mapping(string => PriceSource[]) public priceSources;

    /// @notice Mapping of asset symbols to aggregated prices
    mapping(string => AggregatedPrice) public aggregatedPrices;

    /// @notice Mapping of provider addresses to their status
    mapping(address => bool) public authorizedProviders;

    /// @notice Array of all authorized provider addresses for iteration
    address[] public providerList;

    /// @notice Emitted when a new price is submitted
    event PriceSubmitted(
        string indexed asset,
        address indexed provider,
        uint256 price,
        uint256 timestamp
    );

    /// @notice Emitted when prices are aggregated
    event PricesAggregated(
        string indexed asset,
        uint256 medianPrice,
        uint256 meanPrice,
        uint256 sourceCount
    );

    /// @notice Emitted when a provider is authorized or revoked
    event ProviderStatusChanged(address indexed provider, bool authorized);

    /// @notice Emitted when stale price is detected
    event StalePrice(string indexed asset, uint256 age);

    /// @notice Initializes the oracle with initial provider
    constructor() {
        authorizedProviders[msg.sender] = true;
        providerList.push(msg.sender);
    }

    /// @notice Adds or revokes an authorized price provider
    /// @param _provider Address of the price provider
    /// @param _authorize Whether to authorize or revoke
    function setProviderStatus(address _provider, bool _authorize)
        external
        onlyOwner
    {
        require(_provider != address(0), "Invalid provider address");
        require(
            authorizedProviders[_provider] != _authorize,
            "Provider status unchanged"
        );

        authorizedProviders[_provider] = _authorize;

        if (_authorize) {
            providerList.push(_provider);
        } else {
            _removeProvider(_provider);
        }

        emit ProviderStatusChanged(_provider, _authorize);
    }

    /// @notice Submits a price for an asset from an authorized provider
    /// @param _asset Symbol of the asset (e.g., "BTC", "ETH")
    /// @param _price Price in wei (scaled to PRICE_DECIMALS)
    function submitPrice(string calldata _asset, uint256 _price)
        external
        nonReentrant
    {
        require(authorizedProviders[msg.sender], "Unauthorized provider");
        require(_price > 0, "Price must be positive");
        require(bytes(_asset).length > 0, "Asset symbol required");
        require(bytes(_asset).length <= 10, "Asset symbol too long");

        PriceSource memory newSource = PriceSource({
            provider: msg.sender,
            price: _price,
            timestamp: block.timestamp,
            active: true
        });

        // Find and update existing source from this provider
        PriceSource[] storage sources = priceSources[_asset];
        bool found = false;

        for (uint256 i = 0; i < sources.length; i++) {
            if (sources[i].provider == msg.sender) {
                sources[i] = newSource;
                found = true;
                break;
            }
        }

        if (!found) {
            sources.push(newSource);
        }

        emit PriceSubmitted(_asset, msg.sender, _price, block.timestamp);
    }

    /// @notice Aggregates prices from active sources using median computation
    /// @param _asset Symbol of the asset
    /// @return medianPrice The computed median price
    /// @return meanPrice The computed mean price
    /// @return sourceCount Number of active sources used
    function aggregatePrices(string calldata _asset)
        external
        nonReentrant
        returns (
            uint256 medianPrice,
            uint256 meanPrice,
            uint256 sourceCount
        )
    {
        PriceSource[] storage sources = priceSources[_asset];
        require(sources.length >= MINIMUM_SOURCES, "Insufficient price sources");

        uint256[] memory activePrices = new uint256[](sources.length);
        uint256 activeCount = 0;

        // Collect prices from non-stale active sources
        for (uint256 i = 0; i < sources.length; i++) {
            if (sources[i].active) {
                uint256 age = block.timestamp - sources[i].timestamp;
                if (age <= STALENESS_THRESHOLD) {
                    activePrices[activeCount] = sources[i].price;
                    activeCount++;
                } else {
                    emit StalePrice(_asset, age);
                }
            }
        }

        require(activeCount >= MINIMUM_SOURCES, "Insufficient valid sources");

        // Trim array to actual size
        uint256[] memory validPrices = new uint256[](activeCount);
        uint256 sum = 0;

        for (uint256 i = 0; i < activeCount; i++) {
            validPrices[i] = activePrices[i];
            sum += validPrices[i];
        }

        // Compute median using sorted array
        _sort(validPrices);
        medianPrice = validPrices[activeCount / 2];
        meanPrice = sum / activeCount;

        // Store aggregated price
        aggregatedPrices[_asset] = AggregatedPrice({
            medianPrice: medianPrice,
            meanPrice: meanPrice,
            lastUpdated: block.timestamp,
            sourceCount: activeCount
        });

        emit PricesAggregated(_asset, medianPrice, meanPrice, activeCount);

        return (medianPrice, meanPrice, activeCount);
    }

    /// @notice Retrieves the current aggregated price for an asset
    /// @param _asset Symbol of the asset
    /// @return medianPrice The current median price
    /// @return timestamp When the price was last aggregated
    /// @return isStale Whether the current price is stale
    function getPrice(string calldata _asset)
        external
        view
        returns (
            uint256 medianPrice,
            uint256 timestamp,
            bool isStale
        )
    {
        AggregatedPrice storage priceData = aggregatedPrices[_asset];
        require(priceData.lastUpdated > 0, "No price data available");

        uint256 age = block.timestamp - priceData.lastUpdated;
        isStale = age > STALENESS_THRESHOLD;

        return (priceData.medianPrice, priceData.lastUpdated, isStale);
    }

    /// @notice Returns all price sources for an asset
    /// @param _asset Symbol of the asset
    /// @return Array of PriceSource structures
    function getPriceSources(string calldata _asset)
        external
        view
        returns (PriceSource[] memory)
pragma solidity ^0.8.0;

import "./OracleManager.sol";

contract OracleConsumer {
    OracleManager public oracleManager;

    constructor(address _oracleManager) {
        oracleManager = OracleManager(_oracleManager);
    }

    function getLatestData(string memory provider) public view returns (string memory) {
        OracleData memory data = oracleManager.getOracleData(provider);
        require(data.revealed, "Data not yet revealed");
        return data.data;
    }
}
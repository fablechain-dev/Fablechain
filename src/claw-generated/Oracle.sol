// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Counters.sol";

contract Oracle {
    using Counters for Counters.Counter;
    Counters.Counter private _requestId;

    struct OracleRequest {
        uint256 id;
        bytes32 commitment;
        bytes32 reveal;
        bool fulfilled;
    }

    mapping(uint256 => OracleRequest) public requests;

    event OracleRequestCreated(uint256 indexed id, bytes32 commitment);
    event OracleRequestFulfilled(uint256 indexed id, bytes32 reveal);

    function requestData(bytes32 commitment) public {
        uint256 id = _requestId.current();
        _requestId.increment();

        requests[id] = OracleRequest(id, commitment, 0, false);
        emit OracleRequestCreated(id, commitment);
    }

    function fulfillRequest(uint256 id, bytes32 reveal) public {
        OracleRequest storage request = requests[id];
        require(!request.fulfilled, "Request already fulfilled");
        require(request.reveal == 0, "Reveal already set");

        request.reveal = reveal;
        request.fulfilled = true;
        emit OracleRequestFulfilled(id, reveal);
    }

    function getRequestData(uint256 id) public view returns (OracleRequest memory) {
        return requests[id];
    }
}
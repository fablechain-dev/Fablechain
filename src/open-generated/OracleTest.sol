pragma solidity ^0.8.0;

import "truffle/Assert.sol";
import "./Oracle.sol";

contract OracleTest {
    function testCommitReveal() public {
        Oracle oracle = new Oracle(address(0x0));
        bytes32 dataHash = keccak256(abi.encodePacked("some data"));
        uint256 reward = 100;
        uint256 revealDeadline = block.timestamp + 1 hours;

        oracle.requestData(dataHash, reward, revealDeadline);

        bytes32 requestId = keccak256(abi.encodePacked(dataHash, address(this), block.timestamp));
        Oracle.OracleRequest memory request = oracle.requests(requestId);
        Assert.equal(request.dataHash, dataHash, "Data hash does not match");
        Assert.equal(request.dataProvider, address(this), "Data provider does not match");
        Assert.equal(request.reward, reward, "Reward does not match");
        Assert.equal(request.revealDeadline, revealDeadline, "Reveal deadline does not match");

        oracle.revealData(requestId, "some data", 0x0);
        Assert.equal(oracle.requests(requestId).dataProvider, address(0), "Request should be deleted");
    }
}
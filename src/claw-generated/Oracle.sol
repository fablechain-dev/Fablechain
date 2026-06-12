pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Oracle {
    struct OracleRequest {
        bytes32 dataHash;
        address dataProvider;
        uint256 reward;
        uint256 revealDeadline;
    }

    mapping(bytes32 => OracleRequest) public requests;
    IERC20 public rewardToken;

    constructor(address _rewardToken) {
        rewardToken = IERC20(_rewardToken);
    }

    function requestData(bytes32 _dataHash, uint256 _reward, uint256 _revealDeadline) public {
        require(_reward > 0, "Reward must be positive");
        require(_revealDeadline > block.timestamp, "Reveal deadline must be in the future");

        bytes32 requestId = keccak256(abi.encodePacked(_dataHash, msg.sender, block.timestamp));
        requests[requestId] = OracleRequest({
            dataHash: _dataHash,
            dataProvider: msg.sender,
            reward: _reward,
            revealDeadline: _revealDeadline
        });
    }

    function revealData(bytes32 _requestId, bytes memory _data, bytes32 _proof) public {
        OracleRequest storage request = requests[_requestId];
        require(request.dataProvider != address(0), "Request does not exist");
        require(block.timestamp <= request.revealDeadline, "Reveal deadline has passed");
        require(keccak256(_data) == request.dataHash, "Data does not match commit");
        // Verify _proof

        rewardToken.transfer(request.dataProvider, request.reward);
        delete requests[_requestId];
    }
}
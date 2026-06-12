// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./OpenToken.sol";
import "./Voting.sol";

contract GovernanceManager {
    OpenToken public token;
    Voting public votingContract;

    constructor(OpenToken _token) {
        token = _token;
        votingContract = token.votingContract();
    }

    function proposeUpgrade(string memory title, string memory description, uint256 duration) public {
        token.createProposal(title, description, duration);
    }

    function vote(uint256 proposalId, uint256 amount) public {
        token.vote(proposalId, amount);
    }

    function executeProposal(uint256 proposalId) public {
        // Implement logic to execute approved proposals
    }

    function getProposal(uint256 proposalId)
        public
        view
        returns (
            uint256,
            string memory,
            string memory,
            uint256,
            uint256,
            uint256
        )
    {
        return token.getProposal(proposalId);
    }
}
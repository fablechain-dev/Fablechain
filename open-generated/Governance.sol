// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Governance {
    IERC20 public token;
    mapping(uint256 => Proposal) public proposals;
    uint256 public proposalCount;
    uint256 public votingThreshold;

    struct Proposal {
        string description;
        uint256 votesFor;
        uint256 votesAgainst;
        bool executed;
    }

    constructor(address _token, uint256 _votingThreshold) {
        token = IERC20(_token);
        votingThreshold = _votingThreshold;
    }

    function propose(string memory description) public {
        proposals[proposalCount] = Proposal(description, 0, 0, false);
        proposalCount++;
    }

    function vote(uint256 proposalId, bool support, uint256 amount) public {
        require(amount <= token.balanceOf(msg.sender), "Insufficient token balance");
        if (support) {
            proposals[proposalId].votesFor += amount;
        } else {
            proposals[proposalId].votesAgainst += amount;
        }
    }

    function executeProposal(uint256 proposalId) public {
        Proposal storage proposal = proposals[proposalId];
        require(!proposal.executed, "Proposal already executed");
        require(proposal.votesFor * 2 > token.totalSupply() * votingThreshold, "Proposal did not reach threshold");
        proposal.executed = true;
        // TODO: Implement proposal execution logic
    }
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Voting {
    struct Proposal {
        uint256 id;
        string title;
        string description;
        uint256 startBlock;
        uint256 endBlock;
        uint256 totalVotes;
        mapping(address => bool) hasVoted;
        mapping(address => uint256) voteWeights;
    }

    IERC20 public token;
    mapping(uint256 => Proposal) public proposals;
    uint256 public proposalCount;

    constructor(IERC20 _token) {
        token = _token;
    }

    function createProposal(
        string memory title,
        string memory description,
        uint256 duration
    ) public {
        uint256 startBlock = block.number;
        uint256 endBlock = startBlock + duration;
        proposals[proposalCount] = Proposal(
            proposalCount,
            title,
            description,
            startBlock,
            endBlock,
            0
        );
        proposalCount++;
    }

    function vote(uint256 proposalId, uint256 amount) public {
        Proposal storage proposal = proposals[proposalId];
        require(
            block.number >= proposal.startBlock && block.number < proposal.endBlock,
            "Voting period has ended"
        );
        require(!proposal.hasVoted[msg.sender], "You have already voted");
        uint256 balance = token.balanceOf(msg.sender);
        require(amount <= balance, "Insufficient token balance");
        proposal.hasVoted[msg.sender] = true;
        proposal.voteWeights[msg.sender] = amount;
        proposal.totalVotes += amount;
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
        Proposal storage proposal = proposals[proposalId];
        return (
            proposal.id,
            proposal.title,
            proposal.description,
            proposal.startBlock,
            proposal.endBlock,
            proposal.totalVotes
        );
    }
}
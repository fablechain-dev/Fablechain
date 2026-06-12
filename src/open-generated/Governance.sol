// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Governance {
    IERC20 public token;
    uint256 public votingPeriod;
    uint256 public quorumThreshold;
    uint256 public approvalThreshold;

    struct Proposal {
        uint256 id;
        address proposer;
        string description;
        uint256 startBlock;
        uint256 endBlock;
        uint256 forVotes;
        uint256 againstVotes;
        mapping(address =&gt; bool) hasVoted;
    }

    mapping(uint256 =&gt; Proposal) public proposals;
    uint256 public nextProposalId = 1;

    constructor(IERC20 _token, uint256 _votingPeriod, uint256 _quorumThreshold, uint256 _approvalThreshold) {
        token = _token;
        votingPeriod = _votingPeriod;
        quorumThreshold = _quorumThreshold;
        approvalThreshold = _approvalThreshold;
    }

    function proposeUpgrade(string memory description) public {
        uint256 proposalId = nextProposalId++;
        Proposal storage proposal = proposals[proposalId];
        proposal.id = proposalId;
        proposal.proposer = msg.sender;
        proposal.description = description;
        proposal.startBlock = block.number;
        proposal.endBlock = block.number + votingPeriod;
    }

    function vote(uint256 proposalId, bool support) public {
        Proposal storage proposal = proposals[proposalId];
        require(block.number &gt;= proposal.startBlock &amp;&amp; block.number &lt;= proposal.endBlock, "Voting period has ended");
        require(!proposal.hasVoted[msg.sender], "You have already voted");
        uint256 votingPower = token.balanceOf(msg.sender);
        if (support) {
            proposal.forVotes += votingPower;
        } else {
            proposal.againstVotes += votingPower;
        }
        proposal.hasVoted[msg.sender] = true;
    }

    function executeProposal(uint256 proposalId) public {
        Proposal storage proposal = proposals[proposalId];
        require(block.number &gt; proposal.endBlock, "Voting period has not ended");
        require(proposal.forVotes &gt;= quorumThreshold * (proposal.forVotes + proposal.againstVotes) / 100, "Quorum not reached");
        require(proposal.forVotes &gt; proposal.againstVotes, "Proposal did not pass");
        // Execute the proposed upgrade
    }
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract GovernanceVoting {
    IERC20 public clawToken;
    
    // Voting proposal struct
    struct Proposal {
        uint256 id;
        string title;
        string description;
        uint256 voteStart;
        uint256 voteEnd;
        uint256 quorum;
        mapping(address =&gt; bool) voted;
        mapping(address =&gt; uint256) votes;
        uint256 forVotes;
        uint256 againstVotes;
        bool passed;
    }
    
    // Proposal tracking
    Proposal[] public proposals;
    uint256 public proposalCount;
    
    // Events
    event ProposalCreated(uint256 indexed id, string title, string description, uint256 voteStart, uint256 voteEnd, uint256 quorum);
    event Voted(uint256 indexed proposalId, address indexed voter, bool support, uint256 votes);
    event ProposalPassed(uint256 indexed proposalId);
    
    constructor(address _clawToken) {
        clawToken = IERC20(_clawToken);
    }
    
    // Create a new proposal
    function createProposal(string memory _title, string memory _description, uint256 _voteStart, uint256 _voteEnd, uint256 _quorum) public {
        require(_voteStart &lt; _voteEnd, "Invalid vote period");
        require(_quorum &gt; 0 &amp;&amp; _quorum &lt;= 100, "Invalid quorum percentage");
        
        Proposal storage newProposal = proposals.push();
        newProposal.id = proposalCount++;
        newProposal.title = _title;
        newProposal.description = _description;
        newProposal.voteStart = _voteStart;
        newProposal.voteEnd = _voteEnd;
        newProposal.quorum = _quorum;
        
        emit ProposalCreated(newProposal.id, _title, _description, _voteStart, _voteEnd, _quorum);
    }
    
    // Vote on a proposal
    function vote(uint256 _proposalId, bool _support, uint256 _votes) public {
        Proposal storage proposal = proposals[_proposalId];
        require(block.timestamp &gt;= proposal.voteStart &amp;&amp; block.timestamp &lt;= proposal.voteEnd, "Voting period closed");
        require(!proposal.voted[msg.sender], "Already voted");
        require(clawToken.balanceOf(msg.sender) &gt;= _votes, "Insufficient token balance");
        
        proposal.voted[msg.sender] = true;
        proposal.votes[msg.sender] = _votes;
        
        if (_support) {
            proposal.forVotes += _votes;
        } else {
            proposal.againstVotes += _votes;
        }
        
        emit Voted(_proposalId, msg.sender, _support, _votes);
    }
    
    // Finalize a proposal
    function finalizeProposal(uint256 _proposalId) public {
        Proposal storage proposal = proposals[_proposalId];
        require(block.timestamp &gt; proposal.voteEnd, "Voting period not over");
        
        uint256 totalVotes = proposal.forVotes + proposal.againstVotes;
        require(totalVotes &gt;= proposal.quorum * clawToken.totalSupply() / 100, "Quorum not reached");
        
        proposal.passed = proposal.forVotes &gt; proposal.againstVotes;
        emit ProposalPassed(_proposalId);
    }
}
pragma solidity ^0.8.0;

import "./OpenToken.sol";

contract Governance {
    struct Proposal {
        uint256 id;
        string title;
        string description;
        address creator;
        uint256 createdAt;
        Vote[] votes;
        ProposalStatus status;
    }

    struct Vote {
        address voter;
        uint8 option; // 0 = Nay, 1 = Yay
        uint256 weight;
    }

    enum ProposalStatus {
        Pending,
        Active,
        Approved,
        Rejected
    }

    OpenToken public openToken;
    Proposal[] public proposals;
    uint256 public proposalCounter;

    constructor(address _openToken) {
        openToken = OpenToken(_openToken);
    }

    function createProposal(string memory title, string memory description) public {
        Proposal memory proposal = Proposal({
            id: proposalCounter++,
            title: title,
            description: description,
            creator: msg.sender,
            createdAt: block.timestamp,
            votes: new Vote[](0),
            status: ProposalStatus.Pending
        });
        proposals.push(proposal);
    }

    function voteOnProposal(uint256 proposalId, uint8 option) public {
        Proposal storage proposal = proposals[proposalId];
        uint256 voterBalance = openToken.balanceOf(msg.sender);
        Vote memory vote = Vote({
            voter: msg.sender,
            option: option,
            weight: voterBalance
        });

        bool hasVoted = false;
        for (uint256 i = 0; i < proposal.votes.length; i++) {
            if (proposal.votes[i].voter == msg.sender) {
                proposal.votes[i] = vote;
                hasVoted = true;
                break;
            }
        }
        if (!hasVoted) {
            proposal.votes.push(vote);
        }
    }

    function resolveProposal(uint256 proposalId) public {
        Proposal storage proposal = proposals[proposalId];
        uint256 yayVotes = 0;
        uint256 nayVotes = 0;
        for (uint256 i = 0; i < proposal.votes.length; i++) {
            if (proposal.votes[i].option == 1) {
                yayVotes += proposal.votes[i].weight;
            } else {
                nayVotes += proposal.votes[i].weight;
            }
        }

        if (yayVotes > nayVotes) {
            proposal.status = ProposalStatus.Approved;
        } else {
            proposal.status = ProposalStatus.Rejected;
        }
    }
}
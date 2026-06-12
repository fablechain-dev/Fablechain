import { Proposal, ProposalStatus, Vote } from './types';

let proposalCounter = 0;
const proposals: Proposal[] = [];

export function createProposal(
  title: string,
  description: string,
  creator: string
): Proposal {
  const proposal: Proposal = {
    id: proposalCounter++,
    title,
    description,
    creator,
    createdAt: Date.now(),
    votes: [],
    status: ProposalStatus.Pending
  };
  proposals.push(proposal);
  return proposal;
}

export function voteOnProposal(
  proposalId: number,
  voter: string,
  option: number,
  weight: number
): void {
  const proposal = proposals.find((p) => p.id === proposalId);
  if (!proposal) {
    throw new Error(`Proposal ${proposalId} not found`);
  }

  const existingVote = proposal.votes.find((v) => v.voter === voter);
  if (existingVote) {
    existingVote.option = option;
    existingVote.weight = weight;
  } else {
    proposal.votes.push({ voter, option, weight });
  }
}

export function resolveProposal(proposalId: number): void {
  const proposal = proposals.find((p) => p.id === proposalId);
  if (!proposal) {
    throw new Error(`Proposal ${proposalId} not found`);
  }

  let yayVotes = 0;
  let nayVotes = 0;
  for (const vote of proposal.votes) {
    if (vote.option === 1) {
      yayVotes += vote.weight;
    } else {
      nayVotes += vote.weight;
    }
  }

  if (yayVotes > nayVotes) {
    proposal.status = ProposalStatus.Approved;
  } else {
    proposal.status = ProposalStatus.Rejected;
  }
}
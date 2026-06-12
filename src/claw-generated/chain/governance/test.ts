import { createProposal, voteOnProposal, resolveProposal } from './index';

// Create a new proposal
const proposal = createProposal(
  'Increase block reward',
  'Increase the block reward from 10 to 12 CLW',
  'claw'
);
console.log('Proposal created:', proposal);

// Cast some votes
voteOnProposal(proposal.id, 'user1', 1, 100);
voteOnProposal(proposal.id, 'user2', 0, 50);
voteOnProposal(proposal.id, 'claw', 1, 200);

// Resolve the proposal
resolveProposal(proposal.id);
console.log('Proposal resolved:', proposal);
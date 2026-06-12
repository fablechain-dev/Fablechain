const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('Voting', () => {
  let token, voting;

  beforeEach(async () => {
    const Token = await ethers.getContractFactory('ClawToken');
    token = await Token.deploy('Claw Token', 'CLAW', 1000000);
    voting = await token.votingContract();
  });

  it('should create a proposal', async () => {
    await voting.createProposal('Upgrade to v2', 'Migrate to new contract', 100);
    const proposal = await voting.getProposal(0);
    expect(proposal.title).to.equal('Upgrade to v2');
  });

  it('should allow voting', async () => {
    await voting.createProposal('Upgrade to v2', 'Migrate to new contract', 100);
    await token.approve(voting.address, 100);
    await voting.vote(0, 50);
    const proposal = await voting.getProposal(0);
    expect(proposal.totalVotes).to.equal(50);
  });
});
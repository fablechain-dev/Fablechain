import { expect } from 'chai';
import { ethers } from 'hardhat';
import { CLAW } from '../claw-generated/CLAW';

describe('CLAW Token', () => {
  let claw: CLAW;
  let owner: any, user1: any, user2: any;

  beforeEach(async () => {
    [owner, user1, user2] = await ethers.getSigners();
    const CLAWFactory = await ethers.getContractFactory('CLAW');
    claw = await CLAWFactory.deploy('CLAW Token', 'CLAW', 18, 1000000);
  });

  it('should have the correct initial state', async () => {
    expect(await claw.name()).to.equal('CLAW Token');
    expect(await claw.symbol()).to.equal('CLAW');
    expect(await claw.decimals()).to.equal(18);
    expect(await claw.totalSupply()).to.equal(1000000 * 10 ** 18);
    expect(await claw.balanceOf(owner.address)).to.equal(1000000 * 10 ** 18);
  });

  it('should allow transfers', async () => {
    await claw.transfer(user1.address, 100 * 10 ** 18);
    expect(await claw.balanceOf(owner.address)).to.equal(999900 * 10 ** 18);
    expect(await claw.balanceOf(user1.address)).to.equal(100 * 10 ** 18);
  });

  it('should allow approvals and transferFrom', async () => {
    await claw.approve(user1.address, 100 * 10 ** 18);
    expect(await claw.allowance(owner.address, user1.address)).to.equal(100 * 10 ** 18);

    await claw.connect(user1).transferFrom(owner.address, user2.address, 50 * 10 ** 18);
    expect(await claw.balanceOf(owner.address)).to.equal(999950 * 10 ** 18);
    expect(await claw.balanceOf(user2.address)).to.equal(50 * 10 ** 18);
    expect(await claw.allowance(owner.address, user1.address)).to.equal(50 * 10 ** 18);
  });
});
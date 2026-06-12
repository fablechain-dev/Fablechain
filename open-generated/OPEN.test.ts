import { expect } from 'chai';
import { ethers } from 'hardhat';
import { OPEN } from '../open-generated/OPEN';

describe('OPEN Token', () => {
  let open: OPEN;
  let owner: any, user1: any, user2: any;

  beforeEach(async () => {
    [owner, user1, user2] = await ethers.getSigners();
    const OPENFactory = await ethers.getContractFactory('OPEN');
    open = await OPENFactory.deploy('OPEN Token', 'OPEN', 18, 1000000);
  });

  it('should have the correct initial state', async () => {
    expect(await open.name()).to.equal('OPEN Token');
    expect(await open.symbol()).to.equal('OPEN');
    expect(await open.decimals()).to.equal(18);
    expect(await open.totalSupply()).to.equal(1000000 * 10 ** 18);
    expect(await open.balanceOf(owner.address)).to.equal(1000000 * 10 ** 18);
  });

  it('should allow transfers', async () => {
    await open.transfer(user1.address, 100 * 10 ** 18);
    expect(await open.balanceOf(owner.address)).to.equal(999900 * 10 ** 18);
    expect(await open.balanceOf(user1.address)).to.equal(100 * 10 ** 18);
  });

  it('should allow approvals and transferFrom', async () => {
    await open.approve(user1.address, 100 * 10 ** 18);
    expect(await open.allowance(owner.address, user1.address)).to.equal(100 * 10 ** 18);

    await open.connect(user1).transferFrom(owner.address, user2.address, 50 * 10 ** 18);
    expect(await open.balanceOf(owner.address)).to.equal(999950 * 10 ** 18);
    expect(await open.balanceOf(user2.address)).to.equal(50 * 10 ** 18);
    expect(await open.allowance(owner.address, user1.address)).to.equal(50 * 10 ** 18);
  });
});
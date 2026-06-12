import { expect } from 'chai';
import { ethers } from 'ethers';
import { CRC721 } from './CRC721';

describe('CRC721', () => {
  let contract: CRC721;
  let owner: ethers.Signer;
  let user1: ethers.Signer;

  beforeEach(async () => {
    [owner, user1] = await ethers.getSigners();
    contract = await new CRC721('Test NFT', 'TNFT').deploy();
  });

  it('should mint a new token', async () => {
    await contract.connect(owner).safeMint(await owner.getAddress(), 'ipfs://test-uri');
    expect(await contract.balanceOf(await owner.getAddress())).to.equal(1);
  });

  it('should burn a token', async () => {
    const tokenId = await contract.connect(owner).callStatic.safeMint(await owner.getAddress(), 'ipfs://test-uri');
    await contract.connect(owner).safeMint(await owner.getAddress(), 'ipfs://test-uri');
    await contract.connect(owner).burn(tokenId);
    expect(await contract.balanceOf(await owner.getAddress())).to.equal(1);
  });

  it('should transfer a token', async () => {
    const tokenId = await contract.connect(owner).callStatic.safeMint(await owner.getAddress(), 'ipfs://test-uri');
    await contract.connect(owner).safeMint(await owner.getAddress(), 'ipfs://test-uri');
    await contract.connect(owner).transferFrom(await owner.getAddress(), await user1.getAddress(), tokenId);
    expect(await contract.balanceOf(await owner.getAddress())).to.equal(1);
    expect(await contract.balanceOf(await user1.getAddress())).to.equal(1);
  });
});
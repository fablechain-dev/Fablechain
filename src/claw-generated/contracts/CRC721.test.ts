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
    await contract.connect(owner).mint(await owner.getAddress(), 'Test NFT', 'A test NFT', 'ipfs://test-uri');
    expect(await contract.balanceOf(await owner.getAddress())).to.equal(1);
  });

  it('should burn a token', async () => {
    await contract.connect(owner).mint(await owner.getAddress(), 'Test NFT', 'A test NFT', 'ipfs://test-uri');
    await contract.connect(owner).burn(0);
    expect(await contract.balanceOf(await owner.getAddress())).to.equal(0);
  });

  it('should transfer a token', async () => {
    await contract.connect(owner).mint(await owner.getAddress(), 'Test NFT', 'A test NFT', 'ipfs://test-uri');
    await contract.connect(owner).transferFrom(await owner.getAddress(), await user1.getAddress(), 0);
    expect(await contract.balanceOf(await owner.getAddress())).to.equal(0);
    expect(await contract.balanceOf(await user1.getAddress())).to.equal(1);
  });

  it('should get token metadata', async () => {
    await contract.connect(owner).mint(await owner.getAddress(), 'Test NFT', 'A test NFT', 'ipfs://test-uri');
    const metadata = await contract.getTokenMetadata(0);
    expect(metadata.name).to.equal('Test NFT');
    expect(metadata.description).to.equal('A test NFT');
    expect(metadata.imageUri).to.equal('ipfs://test-uri');
  });
});
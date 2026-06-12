import { expect } from 'chai';
import { ethers } from 'hardhat';
import { CRC721 } from './CRC721';

describe('CRC721', () => {
  let crc721: CRC721;
  let owner: any, addr1: any, addr2: any;

  beforeEach(async () => {
    [owner, addr1, addr2] = await ethers.getSigners();
    const CRC721Contract = await ethers.getContractFactory('CRC721');
    crc721 = await CRC721Contract.deploy('CRC721 Token', 'CRC721');
    await crc721.deployed();
  });

  it('should mint a new token', async () => {
    await crc721.safeMint(addr1.address, 'ipfs://token-uri');
    expect(await crc721.balanceOf(addr1.address)).to.equal(1);
  });

  it('should burn a token', async () => {
    await crc721.safeMint(owner.address, 'ipfs://token-uri');
    const tokenId = await crc721._tokenIdCounter();
    await crc721.burn(tokenId);
    expect(await crc721.balanceOf(owner.address)).to.equal(0);
  });

  it('should transfer a token', async () => {
    await crc721.safeMint(owner.address, 'ipfs://token-uri');
    const tokenId = await crc721._tokenIdCounter();
    await crc721.transferFrom(owner.address, addr1.address, tokenId);
    expect(await crc721.ownerOf(tokenId)).to.equal(addr1.address);
  });
});
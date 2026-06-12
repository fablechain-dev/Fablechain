import { ethers } from 'ethers';
import { CRC721 } from './CRC721';

describe('CRC721', () => {
  let crc721: CRC721;
  let provider: ethers.providers.Provider;
  let owner: ethers.Wallet;
  let user1: ethers.Wallet;

  beforeEach(async () => {
    provider = new ethers.providers.JsonRpcProvider();
    owner = new ethers.Wallet(process.env.OWNER_PRIVATE_KEY!, provider);
    user1 = new ethers.Wallet(process.env.USER1_PRIVATE_KEY!, provider);

    const contractAddress = '0x1234567890123456789012345678901234567890';
    crc721 = new CRC721(contractAddress, provider);
  });

  it('should mint a new NFT', async () => {
    const tokenUri = 'ipfs://QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco/metadata.json';
    const tx = await crc721.safeMint(user1.address, tokenUri);
    await tx.wait();

    const tokenId = 0;
    expect(await crc721.tokenURI(tokenId)).toEqual(tokenUri);
    expect(await provider.getBalance(user1.address)).toEqual(ethers.constants.WeiPerEther.mul(10000));
  });

  it('should burn an NFT', async () => {
    const tokenUri = 'ipfs://QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco/metadata.json';
    await crc721.safeMint(user1.address, tokenUri);

    const tokenId = 0;
    const tx = await crc721.burn(tokenId);
    await tx.wait();

    await expect(crc721.tokenURI(tokenId)).rejects.toThrow();
  });

  it('should transfer an NFT', async () => {
    const tokenUri = 'ipfs://QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco/metadata.json';
    await crc721.safeMint(user1.address, tokenUri);

    const tokenId = 0;
    const tx = await crc721.transferFrom(user1.address, owner.address, tokenId);
    await tx.wait();

    expect(await crc721.ownerOf(tokenId)).toEqual(owner.address);
  });
});
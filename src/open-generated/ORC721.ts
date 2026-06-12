import { ethers } from 'ethers';
import ORC721Abi from './ORC721.sol';

export class ORC721 {
  private contract: ethers.Contract;

  constructor(contractAddress: string, provider: ethers.providers.Provider) {
    this.contract = new ethers.Contract(contractAddress, ORC721Abi, provider);
  }

  async safeMint(to: string, uri: string): Promise<ethers.providers.TransactionResponse> {
    return this.contract.safeMint(to, uri);
  }

  async burn(tokenId: number): Promise<ethers.providers.TransactionResponse> {
    return this.contract.burn(tokenId);
  }

  async transferFrom(from: string, to: string, tokenId: number): Promise<ethers.providers.TransactionResponse> {
    return this.contract.transferFrom(from, to, tokenId);
  }

  async tokenURI(tokenId: number): Promise<string> {
    return this.contract.tokenURI(tokenId);
  }
}
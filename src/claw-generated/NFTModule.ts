import { CRCNFT721 } from './CRCNFT721';

export class NFTModule {
  private nftContract: CRCNFT721;

  constructor() {
    this.nftContract = new CRCNFT721('ClawChain NFT', 'CRCNFT');
  }

  // Add NFT-related functionality here
}
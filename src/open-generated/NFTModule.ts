import { ORCNFT721 } from './ORCNFT721';

export class NFTModule {
  private nftContract: ORCNFT721;

  constructor() {
    this.nftContract = new ORCNFT721('OpenChain NFT', 'ORCNFT');
  }

  // Add NFT-related functionality here
}
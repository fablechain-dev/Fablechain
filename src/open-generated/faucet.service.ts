import { Injectable } from '@nestjs/common';
import { FaucetRepository } from './faucet.repository';
import { OpenToken } from './OpenToken.sol';

@Injectable()
export class FaucetService {
  constructor(private faucetRepository: FaucetRepository, private openToken: OpenToken) {}

  async dispenseTokens(address: string): Promise<{ txHash: string }> {
    // Check if address has already received tokens in the last 24 hours
    const hasReceivedTokens = await this.faucetRepository.hasReceivedTokens(address);
    if (hasReceivedTokens) {
      throw new Error('Address has already received tokens in the last 24 hours');
    }

    // Mint 10 OPEN tokens to the address
    const txHash = await this.openToken.mint(address, 10);

    // Store the address in the repository
    await this.faucetRepository.storeAddress(address);

    return { txHash };
  }
}
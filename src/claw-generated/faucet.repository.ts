import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FaucetAddress } from './entities/faucet-address.entity';

@Injectable()
export class FaucetRepository {
  constructor(
    @InjectRepository(FaucetAddress)
    private faucetAddressRepository: Repository<FaucetAddress>
  ) {}

  async hasReceivedTokens(address: string): Promise<boolean> {
    const faucetAddress = await this.faucetAddressRepository.findOne({
      where: { address, lastRequestTimestamp: MoreThanOrEqual(new Date(Date.now() - 24 * 60 * 60 * 1000)) },
    });
    return !!faucetAddress;
  }

  async storeAddress(address: string): Promise<void> {
    const faucetAddress = new FaucetAddress();
    faucetAddress.address = address;
    faucetAddress.lastRequestTimestamp = new Date();
    await this.faucetAddressRepository.save(faucetAddress);
  }
}
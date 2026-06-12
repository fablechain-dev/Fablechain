import { ethers } from 'ethers';
import { Block } from '../core/Block';

export class ContractDeployer {
  private provider: ethers.providers.Provider;
  private signer: ethers.Signer;

  constructor(provider: ethers.providers.Provider, signer: ethers.Signer) {
    this.provider = provider;
    this.signer = signer;
  }

  async deployContract(
    bytecode: string,
    abi: any[],
    ...args: any[]
  ): Promise<ethers.Contract> {
    const factory = new ethers.ContractFactory(abi, bytecode, this.signer);
    const contract = await factory.deploy(...args);
    await contract.deployed();
    return contract;
  }

  calculateContractAddress(
    bytecode: string,
    senderAddress: string,
    nonce: number
  ): string {
    const address = ethers.utils.getContractAddress({
      from: senderAddress,
      nonce: nonce,
    });
    return address;
  }
}
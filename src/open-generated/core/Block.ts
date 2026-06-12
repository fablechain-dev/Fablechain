import { ethers } from 'ethers';

export class Block {
  transactions: ethers.Transaction[];
  contractDeployments: { address: string; bytecode: string; abi: any[] }[];
  isCheckpoint: boolean;

  constructor() {
    this.transactions = [];
    this.contractDeployments = [];
    this.isCheckpoint = false;
  }

  addTransaction(tx: ethers.Transaction) {
    this.transactions.push(tx);
  }

  addContractDeployment(
    address: string,
    bytecode: string,
    abi: any[]
  ) {
    this.contractDeployments.push({ address, bytecode, abi });
  }

  setCheckpoint() {
    this.isCheckpoint = true;
  }
}
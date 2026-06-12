import { Address, Transaction } from './types';

export interface Account {
  address: Address;
  nonce: number;
  validateTransaction(tx: Transaction): Promise<boolean>;
  incrementNonce(): void;
}

export class EOAAccount implements Account {
  address: Address;
  nonce: number = 0;

  constructor(address: Address) {
    this.address = address;
  }

  async validateTransaction(tx: Transaction): Promise<boolean> {
    if (tx.from !== this.address) {
      return false;
    }

    if (tx.nonce !== this.nonce) {
      return false;
    }

    this.incrementNonce();
    return true;
  }

  incrementNonce(): void {
    this.nonce++;
  }
}

export class SmartContractAccount implements Account {
  address: Address;
  nonce: number = 0;

  constructor(address: Address) {
    this.address = address;
  }

  async validateTransaction(tx: Transaction): Promise<boolean> {
    if (tx.to !== this.address) {
      return false;
    }

    if (tx.nonce !== this.nonce) {
      return false;
    }

    this.incrementNonce();
    return true;
  }

  incrementNonce(): void {
    this.nonce++;
  }
}
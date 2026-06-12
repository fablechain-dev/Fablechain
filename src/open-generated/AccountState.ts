import { PrivateKey, PublicKey } from '../crypto';
import { ContractStorage } from './ContractStorage';

export class AccountState {
  private publicKey: PublicKey;
  private balance: number;
  private nonce: number;
  private contractStorage: ContractStorage;

  constructor(publicKey: PublicKey) {
    this.publicKey = publicKey;
    this.balance = 0;
    this.nonce = 0;
    this.contractStorage = new ContractStorage();
  }

  getPublicKey(): PublicKey {
    return this.publicKey;
  }

  getBalance(): number {
    return this.balance;
  }

  setBalance(balance: number): void {
    this.balance = balance;
  }

  getNonce(): number {
    return this.nonce;
  }

  incrementNonce(): void {
    this.nonce++;
  }

  getContractStorage(): ContractStorage {
    return this.contractStorage;
  }

  createCheckpoint(blockHeight: number): void {
    this.contractStorage.createContractCheckpoint(this.publicKey.toString(), blockHeight);
  }

  pruneState(blockHeight: number): void {
    this.contractStorage.pruneContractState(this.publicKey.toString(), blockHeight);
  }
}
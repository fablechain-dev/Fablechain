import { PrivateKey, PublicKey } from '../crypto';
import { StateTree } from './StateTree';
import { ContractState } from './ContractState';

export class ContractStorage extends AccountStorage {
  private contractState: Map<string, ContractState>;

  constructor() {
    super();
    this.contractState = new Map();
  }

  getContractState(address: string): ContractState {
    if (!this.contractState.has(address)) {
      this.contractState.set(address, new ContractState());
    }
    return this.contractState.get(address)!;
  }

  setContractCode(address: string, code: Uint8Array): void {
    this.getContractState(address).setCode(code);
  }

  getContractCode(address: string): Uint8Array {
    return this.getContractState(address).getCode();
  }

  // New CRUD methods for contract storage
  createContractStorage(address: string, key: string, value: any): void {
    this.getContractState(address).setStorage(key, value);
  }

  readContractStorage(address: string, key: string): any {
    return this.getContractState(address).getStorage(key);
  }

  updateContractStorage(address: string, key: string, newValue: any): void {
    this.getContractState(address).setStorage(key, newValue);
  }

  deleteContractStorage(address: string, key: string): void {
    this.getContractState(address).deleteStorage(key);
  }

  createContractCheckpoint(address: string, blockHeight: number): void {
    this.getContractState(address).createCheckpoint(blockHeight);
  }

  pruneContractState(address: string, blockHeight: number): void {
    this.getContractState(address).pruneState(blockHeight);
  }
}
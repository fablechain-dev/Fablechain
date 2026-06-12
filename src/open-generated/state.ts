import { Account, Contract } from '../types';

export class StateSnapshot {
  accounts: Account[];
  contracts: Contract[];

  constructor() {
    this.accounts = [];
    this.contracts = [];
  }

  serialize(): Uint8Array {
    // TODO: Implement serialization of state
    return new Uint8Array();
  }

  static deserialize(data: Uint8Array): StateSnapshot {
    // TODO: Implement deserialization of state
    return new StateSnapshot();
  }
}
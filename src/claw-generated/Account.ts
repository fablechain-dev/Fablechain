import { AbstractAccount } from './AbstractAccount';

export class Account implements AbstractAccount {
  address: string;

  constructor(address: string) {
    this.address = address;
  }

  validate(tx: Transaction): boolean {
    // Implement standard account validation logic
    return true;
  }
}
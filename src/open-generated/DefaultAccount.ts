import { Account } from './Account';

export class DefaultAccount implements Account {
  address: string;
  privateKey: Uint8Array;

  constructor(address: string, privateKey: Uint8Array) {
    this.address = address;
    this.privateKey = privateKey;
  }

  async sign(data: Uint8Array): Promise<Uint8Array> {
    // Implement signing logic using the private key
    return new Uint8Array();
  }

  async verify(data: Uint8Array, signature: Uint8Array): Promise<boolean> {
    // Implement verification logic using the address and signature
    return true;
  }
}
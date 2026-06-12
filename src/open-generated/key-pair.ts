export class KeyPair {
  private publicKey: Uint8Array;
  private privateKey: Uint8Array;

  constructor(publicKey: Uint8Array, privateKey: Uint8Array) {
    this.publicKey = publicKey;
    this.privateKey = privateKey;
  }

  getPublicKey(): Uint8Array {
    return this.publicKey;
  }

  getPrivateKey(): Uint8Array {
    return this.privateKey;
  }
}
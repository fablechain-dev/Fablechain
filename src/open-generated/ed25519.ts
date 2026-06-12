import { randomBytes } from 'crypto';
import { sign, verify, keyFromSeed } from 'ed25519-hd-key';

export class Ed25519KeyPair {
  publicKey: Uint8Array;
  privateKey: Uint8Array;

  constructor(publicKey: Uint8Array, privateKey: Uint8Array) {
    this.publicKey = publicKey;
    this.privateKey = privateKey;
  }

  static generate(): Ed25519KeyPair {
    const seed = randomBytes(32);
    const { publicKey, privateKey } = keyFromSeed(seed);
    return new Ed25519KeyPair(publicKey, privateKey);
  }

  static fromSeed(seed: Uint8Array): Ed25519KeyPair {
    const { publicKey, privateKey } = keyFromSeed(seed);
    return new Ed25519KeyPair(publicKey, privateKey);
  }

  sign(message: Uint8Array): Uint8Array {
    return sign(message, this.privateKey);
  }

  verify(message: Uint8Array, signature: Uint8Array): boolean {
    return verify(message, signature, this.publicKey);
  }
}
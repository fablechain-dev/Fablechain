import * as crypto from 'crypto';
import bip39 from 'bip39';
import { ec as EC } from 'elliptic';
import bs58 from 'bs58';

export class Wallet {
  private privateKey: Buffer;
  private publicKey: Buffer;

  constructor(seed?: string) {
    if (seed) {
      this.fromSeedPhrase(seed);
    } else {
      this.generateKeyPair();
    }
  }

  generateKeyPair() {
    const ec = new EC('ed25519');
    const keyPair = ec.genKeyPair();
    this.privateKey = keyPair.getPrivate().toBuffer();
    this.publicKey = keyPair.getPublic().toBuffer();
  }

  fromSeedPhrase(seedPhrase: string) {
    const seed = bip39.mnemonicToSeedSync(seedPhrase);
    const ec = new EC('ed25519');
    const keyPair = ec.keyFromSecret(seed.slice(0, 32));
    this.privateKey = keyPair.getPrivate().toBuffer();
    this.publicKey = keyPair.getPublic().toBuffer();
  }

  getAddress(): string {
    const hash = crypto.createHash('sha256').update(this.publicKey).digest();
    const checksum = crypto.createHash('sha256').update(hash).digest().slice(0, 4);
    return bs58.encode(Buffer.concat([hash, checksum]));
  }
}
import { generateMnemonic, mnemonicToSeedSync } from 'bip39';
import { Ed25519KeyPair } from './ed25519';
import { base58Encode } from './encoding';

export class Wallet {
  private keyPair: Ed25519KeyPair;

  constructor(seed?: Uint8Array) {
    if (seed) {
      this.keyPair = Ed25519KeyPair.fromSeed(seed);
    } else {
      this.keyPair = Ed25519KeyPair.generate();
    }
  }

  get publicKey(): Uint8Array {
    return this.keyPair.publicKey;
  }

  get privateKey(): Uint8Array {
    return this.keyPair.privateKey;
  }

  get address(): string {
    return base58Encode(this.publicKey);
  }

  get mnemonic(): string {
    return generateMnemonic();
  }

  static fromMnemonic(mnemonic: string): Wallet {
    const seed = mnemonicToSeedSync(mnemonic);
    return new Wallet(seed);
  }
}
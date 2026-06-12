import * as bip39 from 'bip39';
import * as ed25519 from 'ed25519-hd-key';
import * as bs58 from 'bs58';

export class WalletKeyPair {
  private _privateKey: Uint8Array;
  private _publicKey: Uint8Array;

  constructor(privateKey: Uint8Array, publicKey: Uint8Array) {
    this._privateKey = privateKey;
    this._publicKey = publicKey;
  }

  get privateKey(): Uint8Array {
    return this._privateKey;
  }

  get publicKey(): Uint8Array {
    return this._publicKey;
  }

  get address(): string {
    return bs58.encode(this._publicKey);
  }

  static fromSeedPhrase(seedPhrase: string): WalletKeyPair {
    const seed = bip39.mnemonicToSeedSync(seedPhrase);
    const { key: privateKey } = ed25519.derivePath("m/44'/60'/0'/0/0", seed.toString('hex'));
    const publicKey = ed25519.getPublicKey(privateKey);
    return new WalletKeyPair(privateKey, publicKey);
  }
}
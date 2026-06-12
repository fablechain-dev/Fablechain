import * as bip39 from 'bip39';
import * as ed25519 from 'ed25519-hd-key';
import { encode as encodeBase58 } from 'bs58';

class Wallet {
  private _privateKey: Uint8Array;
  private _publicKey: Uint8Array;
  private _address: string;

  constructor(privateKey?: Uint8Array, mnemonic?: string) {
    if (privateKey) {
      this._privateKey = privateKey;
      this._publicKey = Wallet.derivePublicKey(privateKey);
      this._address = Wallet.deriveAddress(this._publicKey);
    } else if (mnemonic) {
      const seed = bip39.mnemonicToSeedSync(mnemonic);
      const { key: privateKey } = ed25519.derivePath("m/44'/60'/0'/0/0", seed.toString('hex'));
      this._privateKey = privateKey;
      this._publicKey = Wallet.derivePublicKey(privateKey);
      this._address = Wallet.deriveAddress(this._publicKey);
    } else {
      const { privateKey, publicKey } = Wallet.generateKeyPair();
      this._privateKey = privateKey;
      this._publicKey = publicKey;
      this._address = Wallet.deriveAddress(publicKey);
    }
  }

  get privateKey(): Uint8Array {
    return this._privateKey;
  }

  get publicKey(): Uint8Array {
    return this._publicKey;
  }

  get address(): string {
    return this._address;
  }

  static generateKeyPair(): { privateKey: Uint8Array; publicKey: Uint8Array } {
    const seed = bip39.mnemonicToSeedSync('');
    const { key: privateKey } = ed25519.derivePath("m/44'/60'/0'/0/0", seed.toString('hex'));
    const publicKey = Wallet.derivePublicKey(privateKey);
    return { privateKey, publicKey };
  }

  static derivePublicKey(privateKey: Uint8Array): Uint8Array {
    return ed25519.getPublicKey(privateKey);
  }

  static deriveAddress(publicKey: Uint8Array): string {
    return encodeBase58(publicKey);
  }
}

export default Wallet;
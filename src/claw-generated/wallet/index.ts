import * as bip39 from 'bip39';
import * as ed25519 from 'ed25519-hd-key';
import bs58 from 'bs58';

export class Wallet {
  private _seed: Buffer;
  private _privateKey: Buffer;
  private _publicKey: Buffer;
  private _address: string;

  constructor(seed?: string) {
    if (seed) {
      this._seed = Buffer.from(bip39.mnemonicToSeedSync(seed));
    } else {
      this._seed = bip39.generateMnemonic().then(mnemonic => bip39.mnemonicToSeedSync(mnemonic));
    }

    const { key: privateKey } = ed25519.derivePath("m/44'/60'/0'/0/0", this._seed);
    this._privateKey = privateKey;
    this._publicKey = ed25519.getPublicKey(privateKey);
    this._address = bs58.encode(this._publicKey);
  }

  get seed(): string {
    return bip39.entropyToMnemonic(this._seed);
  }

  get privateKey(): string {
    return bs58.encode(this._privateKey);
  }

  get publicKey(): string {
    return bs58.encode(this._publicKey);
  }

  get address(): string {
    return this._address;
  }
}
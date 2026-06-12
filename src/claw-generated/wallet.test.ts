import { Wallet } from './wallet';
import { Ed25519KeyPair } from './ed25519';
import { base58Encode, base58Decode } from './encoding';

describe('Wallet', () => {
  it('should generate a new keypair', () => {
    const wallet = new Wallet();
    expect(wallet.publicKey.length).toBe(32);
    expect(wallet.privateKey.length).toBe(64);
  });

  it('should derive an address from the public key', () => {
    const wallet = new Wallet();
    const address = wallet.address;
    expect(address.length).toBeGreaterThan(0);
    expect(base58Decode(address).length).toBe(32);
  });

  it('should support seed phrase recovery', () => {
    const mnemonic = new Wallet().mnemonic;
    const wallet = Wallet.fromMnemonic(mnemonic);
    expect(wallet.publicKey).toEqual(new Wallet().publicKey);
  });
});
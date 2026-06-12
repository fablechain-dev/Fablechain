import { Wallet } from './index';

describe('Wallet', () => {
  it('should generate a new wallet with a random seed phrase', () => {
    const wallet = new Wallet();
    expect(wallet.seed).toBeDefined();
    expect(wallet.privateKey).toBeDefined();
    expect(wallet.publicKey).toBeDefined();
    expect(wallet.address).toBeDefined();
  });

  it('should restore a wallet from a seed phrase', () => {
    const seedPhrase = 'abandon amount expire adjust cage candy arch gather drum buyer enemy junior modify';
    const wallet = new Wallet(seedPhrase);
    expect(wallet.seed).toEqual(seedPhrase);
    expect(wallet.privateKey).toBeDefined();
    expect(wallet.publicKey).toBeDefined();
    expect(wallet.address).toBeDefined();
  });
});
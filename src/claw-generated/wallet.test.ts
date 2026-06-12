import { Wallet } from './wallet';
import { expect } from 'chai';
import bip39 from 'bip39';

describe('Wallet', () => {
  it('should generate a new keypair', () => {
    const wallet = new Wallet();
    expect(wallet.privateKey).to.be.an.instanceOf(Buffer);
    expect(wallet.publicKey).to.be.an.instanceOf(Buffer);
  });

  it('should derive a keypair from a seed phrase', () => {
    const seedPhrase = 'abandon amount expire adjust cage candy arch gather drum buyer enemy junior emit';
    const wallet = new Wallet(seedPhrase);
    expect(wallet.privateKey).to.be.an.instanceOf(Buffer);
    expect(wallet.publicKey).to.be.an.instanceOf(Buffer);
  });

  it('should generate a valid address', () => {
    const wallet = new Wallet();
    const address = wallet.getAddress();
    expect(address).to.be.a('string');
    expect(address.length).to.be.greaterThan(0);
    expect(bip39.validateMnemonic(address)).to.be.false; // Ensure it's not a valid seed phrase
  });
});
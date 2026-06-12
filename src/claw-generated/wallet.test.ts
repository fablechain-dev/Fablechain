import { WalletKeyPair } from './wallet';

describe('WalletKeyPair', () => {
  it('should generate keypair from seed phrase', () => {
    const seedPhrase = 'abandon amount expire adjust cage candy arch gather drum buyer index orange tree';
    const keyPair = WalletKeyPair.fromSeedPhrase(seedPhrase);

    expect(keyPair.privateKey.length).toBe(32);
    expect(keyPair.publicKey.length).toBe(32);
    expect(keyPair.address).toBe('1KbUJ4x8epz6QqxkmZbTc7ctHxmiF79roughlysimilar');
  });
});
import { generateKeypair, deriveAddress } from '../keypair';

describe('Wallet Keypair', () => {
  it('should generate a valid keypair from a seed phrase', () => {
    const seedPhrase = 'abandon amount expire adjust cage candy arch gather drum buyer enemy junior emit';
    const { publicKey, privateKey } = generateKeypair(seedPhrase);

    expect(publicKey).toBeDefined();
    expect(privateKey).toBeDefined();
    expect(publicKey.length).toEqual(44);
    expect(privateKey.length).toEqual(44);
  });

  it('should derive a valid address from a public key', () => {
    const seedPhrase = 'abandon amount expire adjust cage candy arch gather drum buyer enemy junior emit';
    const { publicKey } = generateKeypair(seedPhrase);
    const address = deriveAddress(publicKey);

    expect(address).toBeDefined();
    expect(address.length).toEqual(34);
  });
});
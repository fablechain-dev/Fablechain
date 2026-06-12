import Wallet from './Wallet';

describe('Wallet', () => {
  it('should generate a new wallet', () => {
    const wallet = new Wallet();
    expect(wallet.privateKey.length).toBe(32);
    expect(wallet.publicKey.length).toBe(32);
    expect(wallet.address.length).toBeGreaterThan(0);
  });

  it('should restore a wallet from a private key', () => {
    const privateKey = new Uint8Array([
      0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
      0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f, 0x10,
      0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18,
      0x19, 0x1a, 0x1b, 0x1c, 0x1d, 0x1e, 0x1f, 0x20
    ]);
    const wallet = new Wallet(privateKey);
    expect(wallet.privateKey).toEqual(privateKey);
    expect(wallet.address).toBe('16UwLL9Risc3QfPqBUvKofHmBQ7wMtjvM');
  });

  it('should restore a wallet from a mnemonic', () => {
    const mnemonic = 'abandon amount expire adjust cage candy arch gather drum buyer mask tombstone';
    const wallet = new Wallet(undefined, mnemonic);
    expect(wallet.privateKey.length).toBe(32);
    expect(wallet.publicKey.length).toBe(32);
    expect(wallet.address).toBe('16UwLL9Risc3QfPqBUvKofHmBQ7wMtjvM');
  });
});
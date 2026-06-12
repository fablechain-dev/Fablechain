import { signTransaction, verifySignature } from './ecdsa';

describe('ECDSA Signing', () => {
  it('should sign and verify a transaction', () => {
    const privateKey = '18e14a7b6a307f426a94f8114701e7c8e774e7f9a47e2c2035db29a206321725';
    const publicKey = '040a4ae9a1e3d1b61f4e6c7d3b616ce0f1825c7e1c1d3d3f9b3c4232d4d1d2e7a5d2b6c1d3d3f9b3c4232d4d1d2e7a5d2b6c1d3d3f9b3c4232d4d1d2e7a5d2b6c';
    const transaction = { to: '0x1234', value: 100 };

    const signature = signTransaction(privateKey, transaction);
    const isValid = verifySignature(publicKey, signature, transaction);

    expect(isValid).toBe(true);
  });
});
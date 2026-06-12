import { TransactionSigner } from './transaction-signer';
import { ECDSAScheme, Ed25519Scheme } from './signature-schemes';

describe('TransactionSigner', () => {
  test('should sign and verify transactions using ECDSA', () => {
    const signer = new TransactionSigner(new ECDSAScheme());
    const transaction = { /* example transaction */ };
    const signature = signer.sign(transaction);
    expect(signer.verify(transaction, signature)).toBe(true);
  });

  test('should sign and verify transactions using Ed25519', () => {
    const signer = new TransactionSigner(new Ed25519Scheme());
    const transaction = { /* example transaction */ };
    const signature = signer.sign(transaction);
    expect(signer.verify(transaction, signature)).toBe(true);
  });
});
import { TransactionSigner } from '../transaction-signer';
import { generateKeypair as generateEd25519Keypair } from '../ed25519';
import { signECDSA, generateKeyPair as generateECDSAKeypair } from '../ecdsa';
import { signSecp256k1, generateKeypair as generateSecp256k1Keypair } from '../secp256k1';

describe('TransactionSigner', () => {
  describe('Ed25519 Signatures', () => {
    it('should sign and verify a transaction', () => {
      const { publicKey, privateKey } = generateEd25519Keypair();
      const transaction = { from: '0x123', to: '0x456', value: 100 };
      const signedTx = TransactionSigner.signTransaction(transaction, { publicKey, privateKey }, 'ed25519');
      expect(TransactionSigner.verifySignature(signedTx)).toBe(true);
    });
  });

  describe('ECDSA Signatures', () => {
    it('should sign and verify a transaction', () => {
      const { publicKey, privateKey } = generateECDSAKeypair();
      const transaction = { from: '0x123', to: '0x456', value: 100 };
      const signedTx = TransactionSigner.signTransaction(transaction, { publicKey, privateKey }, 'ecdsa');
      expect(TransactionSigner.verifySignature(signedTx)).toBe(true);
    });
  });

  describe('SECP256k1 Signatures', () => {
    it('should sign and verify a transaction', () => {
      const { publicKey, privateKey } = generateSecp256k1Keypair();
      const transaction = { from: '0x123', to: '0x456', value: 100 };
      const signedTx = TransactionSigner.signTransaction(transaction, { publicKey, privateKey }, 'secp256k1');
      expect(TransactionSigner.verifySignature(signedTx)).toBe(true);
    });
  });
});
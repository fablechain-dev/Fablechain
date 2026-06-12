import { Wallet, Transaction, SignedTransaction } from '../index';
import { Ed25519SignatureProvider } from '../signature-provider';
import { TransactionSerializer } from '../transaction-serializer';

describe('Wallet', () => {
  let wallet: Wallet;

  beforeEach(() => {
    wallet = new Wallet();
  });

  it('should sign a transaction', async () => {
    const transaction: Transaction = {
      // Sample transaction data
    };

    const signedTx = await wallet.signTransaction(transaction);
    expect(signedTx.transaction).toEqual(transaction);
    expect(signedTx.signature.signature.length).toBeGreaterThan(0);
  });

  it('should serialize and deserialize a transaction', () => {
    const transaction: Transaction = {
      // Sample transaction data
    };

    const serializer = new TransactionSerializer();
    const serializedTx = serializer.serialize(transaction);
    const deserializedTx = serializer.deserialize(serializedTx);

    expect(deserializedTx).toEqual(transaction);
  });
});
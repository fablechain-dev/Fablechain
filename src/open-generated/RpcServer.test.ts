import { Transaction, TransactionMetadata } from '../core/Transaction';
import { TransactionStorage } from '../storage/TransactionStorage';
import { RpcServer } from './RpcServer';

jest.mock('../storage/TransactionStorage');

describe('RpcServer', () => {
  let rpcServer: RpcServer;

  beforeEach(() => {
    rpcServer = new RpcServer();
  });

  test('getTransaction returns transaction with metadata', async () => {
    const signature = 'test-signature';
    const transaction = new Transaction({ data: 'test-tx-data' }, new TransactionMetadata());
    (TransactionStorage as jest.MockedClass<typeof TransactionStorage>).prototype.getTransaction.mockResolvedValue(transaction.data);
    (TransactionStorage as jest.MockedClass<typeof TransactionStorage>).prototype.getTransactionMetadata.mockResolvedValue(transaction.metadata);

    const result = await rpcServer.getTransaction(signature);
    expect(result).toEqual(transaction);
    expect(TransactionStorage.prototype.getTransaction).toHaveBeenCalledWith(signature);
    expect(TransactionStorage.prototype.getTransactionMetadata).toHaveBeenCalledWith(signature);
  });

  test('getTransaction returns null if transaction not found', async () => {
    const signature = 'test-signature';
    (TransactionStorage as jest.MockedClass<typeof TransactionStorage>).prototype.getTransaction.mockResolvedValue(null);

    const result = await rpcServer.getTransaction(signature);
    expect(result).toBeNull();
    expect(TransactionStorage.prototype.getTransaction).toHaveBeenCalledWith(signature);
  });
});
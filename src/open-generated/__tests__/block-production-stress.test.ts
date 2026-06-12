import { Chain } from '../blockchain/Chain';
import { Block } from '../blockchain/Block';
import { TransactionPool } from '../blockchain/TransactionPool';
import { StateManager } from '../blockchain/StateManager';
import { BlockProducer } from '../blockchain/BlockProducer';
import { ValidatorManager } from '../validators/ValidatorManager';
import { EventBus } from '../events/EventBus';

describe('Block Production Stress Tests', () => {
  let chain: Chain;
  let txPool: TransactionPool;
  let stateManager: StateManager;
  let validatorManager: ValidatorManager;
  let eventBus: EventBus;
  let blockProducer: BlockProducer;

  beforeEach(() => {
    chain = new Chain();
    txPool = new TransactionPool();
    stateManager = new StateManager();
    validatorManager = new ValidatorManager();
    eventBus = new EventBus();
    blockProducer = new BlockProducer(chain, txPool, validatorManager, eventBus);
  });

  afterEach(() => {
    blockProducer.stop();
  });

  it('should produce blocks under high transaction load', async () => {
    // Arrange
    const numTransactions = 1000;
    const transactions = generateTransactions(numTransactions);
    transactions.forEach(tx => txPool.addTransaction(tx));

    // Act
    blockProducer.start();
    await new Promise(resolve => setTimeout(resolve, 60000));

    // Assert
    expect(chain.getChainLength()).toBeGreaterThan(0);
    expect(txPool.getPendingTransactions().length).toBeLessThan(numTransactions);
  });

  it('should maintain block production under sustained high load', async () => {
    // Arrange
    const transactionsPerSecond = 100;
    const testDuration = 120000; // 2 minutes

    // Act
    blockProducer.start();
    const startTime = Date.now();
    while (Date.now() - startTime < testDuration) {
      const transactions = generateTransactions(transactionsPerSecond);
      transactions.forEach(tx => txPool.addTransaction(tx));
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Assert
    expect(chain.getChainLength()).toBeGreaterThan(0);
    expect(txPool.getPendingTransactions().length).toBeLessThan(transactionsPerSecond * 10); // 10 seconds of backlog
  });

  function generateTransactions(count: number): Transaction[] {
    const transactions: Transaction[] = [];
    for (let i = 0; i < count; i++) {
      transactions.push({
        from: '0x' + Math.random().toString(16).substring(2, 42),
        to: '0x' + Math.random().toString(16).substring(2, 42),
        value: BigInt(Math.floor(Math.random() * 1000000)),
        gasLimit: BigInt(21000),
        gasPrice: BigInt(1000000000),
        nonce: BigInt(i),
        data: '0x',
        hash: '0x' + Math.random().toString(16).substring(2, 66)
      });
    }
    return transactions;
  }
});
import { Block } from './Block';
import { Blockchain } from './Blockchain';
import { TransactionPool } from './TransactionPool';
import { Transaction } from '../model/Transaction';

export class BlockProducer {
  private blockchain: Blockchain;
  private transactionPool: TransactionPool;

  constructor(blockchain: Blockchain, transactionPool: TransactionPool) {
    this.blockchain = blockchain;
    this.transactionPool = transactionPool;
  }

  produceBlock(): Block {
    // Select transactions from the pool
    const transactions = this.transactionPool.getTransactions();

    // Create a new block
    const prevBlock = this.blockchain.getLatestBlock();
    const timestamp = Date.now();
    const block = new Block(timestamp, transactions, prevBlock.hash);

    // Add the block to the chain
    this.blockchain.addBlock(block);

    // Clear the transaction pool
    transactions.forEach(tx => this.transactionPool.removeTransaction(tx));

    return block;
  }
}
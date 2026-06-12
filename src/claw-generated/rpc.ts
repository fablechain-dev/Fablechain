import { Transaction } from './transaction';
import { Block } from './block';

export class RPC {
  async getTransactionReceipt(txHash: string): Promise<{
    from: string;
    to: string;
    value: number;
    fee: number;
  }> {
    // Look up transaction by hash and return receipt
    const tx = this.getTransaction(txHash);
    return {
      from: tx.from,
      to: tx.to,
      value: tx.value,
      fee: tx.calculateFee()
    };
  }

  async getBlockReward(blockNumber: number): Promise<number> {
    // Look up block by number and return reward
    const block = this.getBlock(blockNumber);
    return block.calculateReward();
  }

  private getTransaction(txHash: string): Transaction {
    // Look up transaction by hash and return it
    return new Transaction('0x123', '0x456', 1, 'contract.call()');
  }

  private getBlock(blockNumber: number): Block {
    // Look up block by number and return it
    const tx = new Transaction('0x123', '0x456', 1, 'contract.deploy()');
    const block = new Block();
    block.addTransaction(tx);
    return block;
  }
}
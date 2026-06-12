import { VM } from './VM';
import { Block } from './Block';

export class BlockExecutor {
  private vm: VM;

  constructor(gasLimit: number) {
    this.vm = new VM(gasLimit);
  }

  executeBlock(block: Block): void {
    for (const transaction of block.transactions) {
      this.executeTransaction(transaction);
    }
  }

  private executeTransaction(transaction: any): void {
    try {
      this.vm.execute(transaction.instructions);
    } catch (err) {
      // Handle out-of-gas errors
      console.error('Transaction execution failed:', err.message);
    }
  }
}
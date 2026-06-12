import { Block } from './Block';

export class BlockChain {
  private chain: Block[] = [];
  private pendingTransactions: any[] = [];
  private readonly requiredConfirmations: number = 6;

  constructor() {
    this.createGenesisBlock();
  }

  private createGenesisBlock(): void {
    const genesisBlock = new Block(0, Date.now(), [], '0');
    genesisBlock.isFinalized = true;
    this.chain.push(genesisBlock);
  }

  public getLatestBlock(): Block {
    return this.chain[this.chain.length - 1];
  }

  public addTransaction(transaction: any): void {
    this.pendingTransactions.push(transaction);
  }

  public minePendingTransactions(miningRewardAddress: string): void {
    // Implement mining logic here
    const newBlock = new Block(
      this.getLatestBlock().index + 1,
      Date.now(),
      this.pendingTransactions,
      this.getLatestBlock().hash
    );
    this.chain.push(newBlock);
    this.pendingTransactions = [];

    // Mark the new block as finalized after the required number of confirmations
    setTimeout(() => {
      newBlock.isFinalized = true;
    }, this.requiredConfirmations * 10000); // 10 seconds per confirmation
  }

  public getChain(): Block[] {
    return this.chain;
  }

  public getFinalized(): Block[] {
    return this.chain.filter((block) => block.isFinalized);
  }

  public getPending(): Block[] {
    return this.chain.filter((block) => !block.isFinalized);
  }

  public isTransactionFinalized(transactionHash: string): boolean {
    const finalized = this.getFinalized();
    return finalized.some((block) =>
      block.transactions.some((tx) => tx.hash === transactionHash)
    );
  }
}
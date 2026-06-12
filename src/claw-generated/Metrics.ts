export class Metrics {
  blocksProducedTotal: number = 0;
  blockTimeSeconds: number = 0;
  transactionsProcessedTotal: number = 0;
  transactionTimeSeconds: number = 0;

  updateBlockMetrics(blockCount: number, blockTime: number) {
    this.blocksProducedTotal += blockCount;
    this.blockTimeSeconds = blockTime;
  }

  updateTransactionMetrics(txCount: number, txTime: number) {
    this.transactionsProcessedTotal += txCount;
    this.transactionTimeSeconds = txTime;
  }
}
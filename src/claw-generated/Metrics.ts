import { BlockManager } from './BlockManager';
import { PeerManager } from './PeerManager';

export class Metrics {
  private static transactionCount: number = 0;
  private static lastTransactionTimestamp: number = Date.now();

  public static getTransactionsPerSecond(): number {
    const currentTimestamp = Date.now();
    const elapsedSeconds = (currentTimestamp - this.lastTransactionTimestamp) / 1000;
    const tps = this.transactionCount / elapsedSeconds;
    this.transactionCount = 0;
    this.lastTransactionTimestamp = currentTimestamp;
    return tps;
  }

  public static async getAverageBlockTime(): Promise<number> {
    const blockManager = await BlockManager.getInstance();
    const blockTimes = await blockManager.getBlockTimes();
    const totalTime = blockTimes.reduce((sum, time) => sum + time, 0);
    return totalTime / blockTimes.length;
  }

  public static async getDifficulty(): Promise<number> {
    const blockManager = await BlockManager.getInstance();
    return await blockManager.getDifficulty();
  }

  public static async getHashrate(): Promise<number> {
    const blockManager = await BlockManager.getInstance();
    return await blockManager.getHashrate();
  }

  public static async getActiveAddressCount(): Promise<number> {
    const peerManager = await PeerManager.getInstance();
    return await peerManager.getActiveAddressCount();
  }

  public static incrementTransactionCount(): void {
    this.transactionCount++;
  }
}
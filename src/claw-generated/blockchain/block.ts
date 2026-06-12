export class Block {
  height: number;
  timestamp: number;
  transactions: any[];
  previousHash: string;
  hash: string;
  size: number;

  static MAX_BLOCK_SIZE = 2 * 1024 * 1024; // 2 MB
  static BLOCK_SIZE_WINDOW = 100; // Track last 100 blocks for dynamic adjustment

  static CHECKPOINT_INTERVAL = 10_000; // Checkpoint every 10,000 blocks
  static CHECKPOINTS: { [blockNumber: number]: { hash: string, timestamp: number } } = {
    0: { hash: '0x...', timestamp: 1620000000 },
    10000: { hash: '0x...', timestamp: 1620010000 },
    20000: { hash: '0x...', timestamp: 1620020000 },
    // Add more checkpoints here
  };

  private static recentBlockSizes: number[] = [];

  constructor(height: number, timestamp: number, transactions: any[], previousHash: string, hash: string, size: number) {
    this.height = height;
    this.timestamp = timestamp;
    this.transactions = transactions;
    this.previousHash = previousHash;
    this.hash = hash;
    this.size = size;

    // Add the new block size to the recent block sizes array
    Block.recentBlockSizes.push(size);

    // Remove the oldest block size if the array is larger than the window
    if (Block.recentBlockSizes.length > Block.BLOCK_SIZE_WINDOW) {
      Block.recentBlockSizes.shift();
    }
  }

  static isAtCheckpoint(blockNumber: number): boolean {
    return blockNumber in this.CHECKPOINTS;
  }

  static getCheckpointData(blockNumber: number): { hash: string, timestamp: number } | null {
    return this.CHECKPOINTS[blockNumber] || null;
  }

  validate(): boolean {
    // Check if block size is within the dynamic limit
    const averageBlockSize = this.getAverageBlockSize();
    const dynamicLimit = Math.max(Block.MAX_BLOCK_SIZE, averageBlockSize * 1.5);
    return this.size <= dynamicLimit;
  }

  private static getAverageBlockSize(): number {
    if (Block.recentBlockSizes.length === 0) {
      return Block.MAX_BLOCK_SIZE;
    }
    return Block.recentBlockSizes.reduce((sum, size) => sum + size, 0) / Block.recentBlockSizes.length;
  }
}
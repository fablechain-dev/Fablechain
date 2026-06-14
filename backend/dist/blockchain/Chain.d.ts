import { Block } from './Block';
export interface ChainBlockSummary {
    height: number;
    hash: string;
    parentHash: string;
    producer: string;
    timestamp: number;
    transactionCount: number;
    gasUsed: string;
    gasLimit: string;
    stateRoot: string;
    difficulty: number;
    transactions?: Array<{
        hash: string;
        from: string;
        to: string;
        value: string;
        gasPrice: string;
        nonce: number;
    }>;
}
export declare class Chain {
    private blocks;
    private difficulty;
    private genesisTime;
    private totalTransactions;
    private orphanedBlocks;
    initialize(): Promise<void>;
    private rowToBlock;
    private createGenesisBlock;
    addBlock(block: Block): Promise<boolean>;
    getLatestBlock(): Block | undefined;
    getBlockByHeight(height: number): Block | undefined;
    getBlockByHash(hash: string): Block | undefined;
    getAllBlocks(): Block[];
    private blockToSummary;
    private getVirtualProducer;
    private getVirtualTimestamp;
    private getVirtualTransactionCount;
    private getVirtualBlockHash;
    getBlockSummaryByHeight(height: number, includeTransactions?: boolean): ChainBlockSummary | undefined;
    getRecentBlockSummaries(count?: number): ChainBlockSummary[];
    getBlockSummaryByHash(hash: string): ChainBlockSummary | undefined;
    getChainLength(): number;
    getStoredBlockCount(): number;
    getGenesisTime(): number;
    getTotalTransactions(): number;
    getStoredTransactionCount(): number;
    getRecentBlocks(count?: number): Block[];
    handleReorg(newBlocks: Block[], commonAncestorHeight: number): Promise<{
        success: boolean;
        orphaned: Block[];
        added: Block[];
    }>;
    findCommonAncestor(newBlocks: Block[]): number;
    getOrphanedBlocks(): Block[];
    pruneOrphans(maxAge?: number): number;
    getStats(): {
        height: number;
        totalTransactions: number;
        genesisTime: number;
        orphanedBlocks: number;
        latestBlockTime: number;
        avgBlockTime: number;
        storedBlocks: number;
        storedTransactions: number;
    };
}
//# sourceMappingURL=Chain.d.ts.map
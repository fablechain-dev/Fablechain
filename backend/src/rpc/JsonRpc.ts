```typescript
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

interface JsonRpcRequest {
  jsonrpc: '2.0';
  method: string;
  params: unknown[];
  id: string | number | null;
}

interface JsonRpcResponse<T = unknown> {
  jsonrpc: '2.0';
  result?: T;
  error?: JsonRpcError;
  id: string | number | null;
}

interface JsonRpcError {
  code: number;
  message: string;
  data?: unknown;
}

interface Block {
  hash: string;
  number: bigint;
  timestamp: number;
  parentHash: string;
  miner: string;
  transactions: string[];
  gasUsed: bigint;
  gasLimit: bigint;
  difficulty: bigint;
  nonce: string;
}

interface TransactionData {
  from: string;
  to: string;
  value: bigint;
  data: string;
  gasLimit: bigint;
  gasPrice: bigint;
  nonce: number;
}

interface Transaction {
  hash: string;
  from: string;
  to: string | null;
  value: bigint;
  data: string;
  gasLimit: bigint;
  gasPrice: bigint;
  nonce: number;
  blockHash: string | null;
  blockNumber: bigint | null;
  transactionIndex: number | null;
  status: 'pending' | 'confirmed' | 'failed';
}

interface AccountState {
  balance: bigint;
  nonce: number;
  codeHash: string;
  storageRoot: string;
}

class JsonRpcServer extends EventEmitter {
  private blockStore: Map<string, Block>;
  private transactionPool: Map<string, Transaction>;
  private accountState: Map<string, AccountState>;
  private blockChain: string[];
  private currentBlockNumber: bigint;

  constructor() {
    super();
    this.blockStore = new Map();
    this.transactionPool = new Map();
    this.accountState = new Map();
    this.blockChain = [];
    this.currentBlockNumber = 0n;
    this.initializeGenesisBlock();
  }

  private initializeGenesisBlock(): void {
    const genesisBlock: Block = {
      hash: '0x' + '0'.repeat(64),
      number: 0n,
      timestamp: Math.floor(Date.now() / 1000),
      parentHash: '0x' + '0'.repeat(64),
      miner: '0x' + '0'.repeat(40),
      transactions: [],
      gasUsed: 0n,
      gasLimit: 30000000n,
      difficulty: 1n,
      nonce: '0x0',
    };
    this.blockStore.set(genesisBlock.hash, genesisBlock);
    this.blockChain.push(genesisBlock.hash);
  }

  private validateAddress(address: string): boolean {
    return /^0x[0-9a-fA-F]{40}$/.test(address);
  }

  private validateHash(hash: string): boolean {
    return /^0x[0-9a-fA-F]{64}$/.test(hash);
  }

  private generateHash(input: string): string {
    const crypto = require('crypto');
    return '0x' + crypto.createHash('sha256').update(input).digest('hex');
  }

  private ensureAccountExists(address: string): void {
    if (!this.accountState.has(address)) {
      this.accountState.set(address, {
        balance: 1000n * 10n ** 18n,
        nonce: 0,
        codeHash: '0x' + '0'.repeat(64),
        storageRoot: '0x' + '0'.repeat(64),
      });
    }
  }

  public async handleRequest(request: JsonRpcRequest): Promise<JsonRpcResponse> {
    try {
      if (request.jsonrpc !== '2.0') {
        return this.createErrorResponse(request.id, -32600, 'Invalid Request');
      }

      if (!request.method) {
        return this.createErrorResponse(request.id, -32600, 'Missing method');
      }

      switch (request.method) {
        case 'fable_getBlock':
          return await this.getBlock(request);
        case 'fable_sendTransaction':
          return await this.sendTransaction(request);
        case 'fable_getBalance':
          return await this.getBalance(request);
        case 'fable_call':
          return await this.call(request);
        case 'web3_clientVersion':
          return this.createResponse(request.id, 'Fablechain/1.0.0');
        case 'net_version':
          return this.createResponse(request.id, '1');
        case 'eth_chainId':
          return this.createResponse(request.id, '0x1');
        case 'eth_blockNumber':
          return this.createResponse(request.id, '0x' + this.currentBlockNumber.toString(16));
        default:
          return this.createErrorResponse(request.id, -32601, 'Method not found');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return this.createErrorResponse(request.id, -32603, 'Internal error', message);
    }
  }

  private async getBlock(request: JsonRpcRequest): Promise<JsonRpcResponse> {
    const params = request.params as string[];
    if (!params || params.length === 0) {
      return this.createErrorResponse(request.id, -32602, 'Missing blockHash parameter');
    }

    const blockHash = params[0];
    if (!this.validateHash(blockHash)) {
      return this.createErrorResponse(request.id, -32602, 'Invalid block hash format');
    }

    const block = this.blockStore.get(blockHash);
    if (!block) {
      return this.createResponse(request.id, null);
    }

    const blockResponse = {
      hash: block.hash,
      number: '0x' + block.number.toString(16),
      timestamp: block.timestamp,
      parentHash: block.parentHash,
      miner: block.miner,
      transactions: block.transactions,
      gasUsed: '0x' + block.gasUsed.toString(16),
      gasLimit: '0x' + block.gasLimit.toString(16),
      difficulty: '0x' + block.difficulty.toString(16),
      nonce: block.nonce,
    };

    return this.createResponse(request.id, blockResponse);
  }

  private async sendTransaction(request: JsonRpcRequest): Promise<JsonRpcResponse> {
    const params = request.params as [Partial<TransactionData>];
    if (!params || params.length === 0) {
      return this.createErrorResponse(request.id, -32602, 'Missing transaction data');
    }

    const txData = params[0];

    if (!txData.from || !this.validateAddress(txData.from)) {
      return this.createErrorResponse(request.id, -32602, 'Invalid from address');
    }

    if (txData.to && !this.validateAddress(txData.to)) {
      return this.createErrorResponse(request.id, -32602, 'Invalid to address');
    }

    this.ensureAccountExists(txData.from);
    const sender = this.accountState.get(txData.from)!;

    const gasPrice = txData.gasPrice || 1n;
    const gasLimit = txData.gasLimit || 21000n;
    const value = txData.value || 0n;
    const totalCost = gasPrice * gasLimit + value;

    if (sender.balance < totalCost) {
      return this.createErrorResponse(request.id, -32602, 'Insufficient balance');
    }

    const txHash = this
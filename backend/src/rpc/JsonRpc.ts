```typescript
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

interface JsonRpcRequest {
  jsonrpc: '2.0';
  method: string;
  params?: unknown[];
  id?: string | number | null;
}

interface JsonRpcResponse {
  jsonrpc: '2.0';
  result?: unknown;
  error?: JsonRpcError;
  id: string | number | null;
}

interface JsonRpcError {
  code: number;
  message: string;
  data?: unknown;
}

interface BlockData {
  hash: string;
  number: number;
  timestamp: number;
  transactions: string[];
  miner: string;
  gasUsed: number;
  gasLimit: number;
  parentHash: string;
  stateRoot: string;
  difficulty: string;
  nonce: string;
}

interface TransactionData {
  hash: string;
  from: string;
  to: string;
  value: string;
  gasPrice: string;
  gas: number;
  nonce: number;
  data: string;
  blockNumber?: number;
  blockHash?: string;
  transactionIndex?: number;
  status?: number;
}

interface AccountBalance {
  address: string;
  balance: string;
  nonce: number;
}

interface CallRequest {
  from?: string;
  to: string;
  gas?: number;
  gasPrice?: string;
  value?: string;
  data?: string;
}

interface CallResult {
  result: string;
  gasUsed: number;
}

type RpcHandler = (params: unknown[]) => Promise<unknown>;

class JsonRpcError extends Error {
  constructor(
    public code: number,
    message: string,
    public data?: unknown
  ) {
    super(message);
    this.name = 'JsonRpcError';
  }
}

export class JsonRpcServer extends EventEmitter {
  private handlers: Map<string, RpcHandler> = new Map();
  private blockStore: Map<number, BlockData> = new Map();
  private transactionStore: Map<string, TransactionData> = new Map();
  private accountBalances: Map<string, AccountBalance> = new Map();
  private pendingTransactions: TransactionData[] = [];
  private nextBlockNumber: number = 1;
  private nextNonce: Map<string, number> = new Map();

  constructor() {
    super();
    this.registerHandlers();
    this.initializeGenesisBlock();
  }

  private registerHandlers(): void {
    this.handlers.set('fable_getBlock', this.handleGetBlock.bind(this));
    this.handlers.set('fable_sendTransaction', this.handleSendTransaction.bind(this));
    this.handlers.set('fable_getBalance', this.handleGetBalance.bind(this));
    this.handlers.set('fable_call', this.handleCall.bind(this));
    this.handlers.set('web3_clientVersion', this.handleClientVersion.bind(this));
    this.handlers.set('net_version', this.handleNetVersion.bind(this));
  }

  private initializeGenesisBlock(): void {
    const genesisBlock: BlockData = {
      hash: '0x0000000000000000000000000000000000000000000000000000000000000000',
      number: 0,
      timestamp: Math.floor(Date.now() / 1000),
      transactions: [],
      miner: '0x0000000000000000000000000000000000000000',
      gasUsed: 0,
      gasLimit: 30000000,
      parentHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
      stateRoot: '0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421',
      difficulty: '0x1',
      nonce: '0x0'
    };
    this.blockStore.set(0, genesisBlock);
  }

  private async handleGetBlock(params: unknown[]): Promise<BlockData> {
    if (!Array.isArray(params) || params.length === 0) {
      throw new JsonRpcError(-32602, 'Invalid params: expected [blockIdentifier]');
    }

    const blockIdentifier = params[0];
    let blockNumber: number;

    if (typeof blockIdentifier === 'string') {
      if (blockIdentifier === 'latest') {
        blockNumber = this.nextBlockNumber - 1;
      } else if (blockIdentifier.startsWith('0x')) {
        blockNumber = parseInt(blockIdentifier, 16);
      } else {
        throw new JsonRpcError(-32602, 'Invalid block identifier format');
      }
    } else if (typeof blockIdentifier === 'number') {
      blockNumber = blockIdentifier;
    } else {
      throw new JsonRpcError(-32602, 'Block identifier must be string or number');
    }

    const block = this.blockStore.get(blockNumber);
    if (!block) {
      throw new JsonRpcError(-32001, `Block not found: ${blockNumber}`);
    }

    return block;
  }

  private async handleSendTransaction(params: unknown[]): Promise<string> {
    if (!Array.isArray(params) || params.length === 0) {
      throw new JsonRpcError(-32602, 'Invalid params: expected [transactionObject]');
    }

    const txObj = params[0] as Partial<TransactionData>;

    if (!txObj.from || !this.isValidAddress(txObj.from)) {
      throw new JsonRpcError(-32602, 'Invalid from address');
    }

    if (!txObj.to || !this.isValidAddress(txObj.to)) {
      throw new JsonRpcError(-32602, 'Invalid to address');
    }

    if (!txObj.value || typeof txObj.value !== 'string') {
      throw new JsonRpcError(-32602, 'Invalid value');
    }

    if (!txObj.gasPrice || typeof txObj.gasPrice !== 'string') {
      throw new JsonRpcError(-32602, 'Invalid gasPrice');
    }

    if (typeof txObj.gas !== 'number' || txObj.gas <= 0) {
      throw new JsonRpcError(-32602, 'Invalid gas');
    }

    const fromNonce = this.nextNonce.get(txObj.from) || 0;
    const txHash = this.generateTransactionHash(txObj.from, fromNonce);

    const transaction: TransactionData = {
      hash: txHash,
      from: txObj.from,
      to: txObj.to,
      value: txObj.value,
      gasPrice: txObj.gasPrice,
      gas: txObj.gas,
      nonce: fromNonce,
      data: txObj.data || '0x',
    };

    this.pendingTransactions.push(transaction);
    this.nextNonce.set(txObj.from, fromNonce + 1);
    this.transactionStore.set(txHash, transaction);

    this.emit('transaction:pending', transaction);

    return txHash;
  }

  private async handleGetBalance(params: unknown[]): Promise<string> {
    if (!Array.isArray(params) || params.length === 0) {
      throw new JsonRpcError(-32602, 'Invalid params: expected [address]');
    }

    const address = params[0];
    if (typeof address !== 'string' || !this.isValidAddress(address)) {
      throw new JsonRpcError(-32602, 'Invalid address format');
    }

    const blockIdentifier = params[1] || 'latest';

    const account = this.accountBalances.get(address.toLowerCase());
    if (!account) {
      return '0x0';
    }

    return account.balance;
  }

  private async handleCall(params: unknown[]): Promise<CallResult> {
    if (!Array.isArray(params) || params.length === 0) {
```typescript
import crypto from 'crypto';
import { EventEmitter } from 'events';
import * as bip39 from 'bip39';
import * as hdkey from 'hdkey';
import { ec as EC } from 'elliptic';
import { keccak256 } from 'js-sha3';

interface Account {
  address: string;
  publicKey: string;
  privateKey: string;
  nonce: bigint;
  balance: bigint;
  derivationPath: string;
  isHardware: boolean;
}

interface Transaction {
  from: string;
  to: string;
  value: bigint;
  data: string;
  gas: bigint;
  gasPrice: bigint;
  nonce: bigint;
  chainId: number;
}

interface SignedTransaction {
  transaction: Transaction;
  signature: {
    r: string;
    s: string;
    v: number;
  };
  hash: string;
}

interface AccountBalance {
  address: string;
  balance: bigint;
  nonce: bigint;
  lastUpdated: number;
}

class AccountManager extends EventEmitter {
  private accounts: Map<string, Account>;
  private balances: Map<string, AccountBalance>;
  private masterSeed: Buffer | null;
  private ec: EC;
  private chainId: number;
  private nonceCache: Map<string, bigint>;
  private readonly derivationPathTemplate = "m/44'/60'/0'/0";

  constructor(chainId: number = 1) {
    super();
    this.accounts = new Map();
    this.balances = new Map();
    this.nonceCache = new Map();
    this.masterSeed = null;
    this.chainId = chainId;
    this.ec = new EC('secp256k1');
  }

  createAccountFromMnemonic(mnemonic: string, count: number = 1, startIndex: number = 0): Account[] {
    if (!bip39.validateMnemonic(mnemonic)) {
      throw new Error('Invalid mnemonic phrase');
    }

    const seed = bip39.mnemonicToSeedSync(mnemonic);
    this.masterSeed = seed;

    const hdwallet = hdkey.fromMasterSeed(seed);
    const accounts: Account[] = [];

    for (let i = startIndex; i < startIndex + count; i++) {
      const path = `${this.derivationPathTemplate}/${i}`;
      const wallet = hdwallet.derive(path);
      const privateKey = wallet.privateKey.toString('hex');
      const account = this.createAccountFromPrivateKey(privateKey, path);
      accounts.push(account);
    }

    return accounts;
  }

  createAccountFromPrivateKey(privateKey: string, derivationPath?: string): Account {
    const cleanPrivateKey = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;

    if (!/^[0-9a-fA-F]{64}$/.test(cleanPrivateKey)) {
      throw new Error('Invalid private key format');
    }

    const keyPair = this.ec.keyFromPrivate(cleanPrivateKey);
    const publicKey = keyPair.getPublic('hex');
    const address = this.deriveAddressFromPublicKey(publicKey);

    const account: Account = {
      address,
      publicKey,
      privateKey: cleanPrivateKey,
      nonce: 0n,
      balance: 0n,
      derivationPath: derivationPath || 'imported',
      isHardware: false,
    };

    this.accounts.set(address.toLowerCase(), account);
    this.nonceCache.set(address.toLowerCase(), 0n);

    this.emit('accountCreated', {
      address,
      publicKey,
      derivationPath: account.derivationPath,
    });

    return account;
  }

  importAccount(privateKey: string): Account {
    return this.createAccountFromPrivateKey(privateKey, 'imported');
  }

  getAccount(address: string): Account | undefined {
    return this.accounts.get(address.toLowerCase());
  }

  getAllAccounts(): Account[] {
    return Array.from(this.accounts.values());
  }

  deleteAccount(address: string): boolean {
    const normalizedAddress = address.toLowerCase();
    const deleted = this.accounts.delete(normalizedAddress);
    if (deleted) {
      this.balances.delete(normalizedAddress);
      this.nonceCache.delete(normalizedAddress);
      this.emit('accountDeleted', { address: normalizedAddress });
    }
    return deleted;
  }

  signTransaction(transaction: Transaction, signerAddress: string): SignedTransaction {
    const account = this.getAccount(signerAddress);
    if (!account) {
      throw new Error(`Account not found: ${signerAddress}`);
    }

    const txHash = this.hashTransaction(transaction);
    const keyPair = this.ec.keyFromPrivate(account.privateKey);
    const signature = keyPair.sign(txHash);

    const signedTx: SignedTransaction = {
      transaction,
      signature: {
        r: signature.r.toString('hex'),
        s: signature.s.toString('hex'),
        v: this.chainId * 2 + 35 + (signature.recoveryParam || 0),
      },
      hash: '0x' + this.hashMessageForRLP(this.encodeTransaction(transaction, signature)).toString('hex'),
    };

    this.emit('transactionSigned', {
      hash: signedTx.hash,
      from: signerAddress,
      to: transaction.to,
    });

    return signedTx;
  }

  signMessage(message: string, signerAddress: string): { signature: string; messageHash: string } {
    const account = this.getAccount(signerAddress);
    if (!account) {
      throw new Error(`Account not found: ${signerAddress}`);
    }

    const messageHash = this.hashMessage(message);
    const keyPair = this.ec.keyFromPrivate(account.privateKey);
    const signature = keyPair.sign(messageHash);

    const signatureHex =
      '0x' +
      signature.r.toString(16).padStart(64, '0') +
      signature.s.toString(16).padStart(64, '0') +
      (signature.recoveryParam || 0).toString(16);

    return {
      signature: signatureHex,
      messageHash: '0x' + messageHash.toString('hex'),
    };
  }

  updateBalance(address: string, balance: bigint): void {
    const normalizedAddress = address.toLowerCase();
    const account = this.accounts.get(normalizedAddress);

    if (!account) {
      throw new Error(`Account not found: ${address}`);
    }

    account.balance = balance;
    this.balances.set(normalizedAddress, {
      address: normalizedAddress,
      balance,
      nonce: account.nonce,
      lastUpdated: Date.now(),
    });

    this.emit('balanceUpdated', { address: normalizedAddress, balance });
  }

  updateNonce(address: string, nonce: bigint): void {
    const normalizedAddress = address.toLowerCase();
    const account = this.accounts.get(normalizedAddress);

    if (!account) {
      throw new Error(`Account not found: ${address}`);
    }

    account.nonce = nonce;
    this.nonceCache.set(normalizedAddress, nonce);

    this.emit('nonceUpdated', { address: normalizedAddress, nonce });
  }

  getNonce(address: string): bigint {
    const normalizedAddress = address.toLowerCase();
    return this.nonceCache.get(normalizedAddress) ?? 0n;
  }

  incrementNonce(address: string): bigint {
    const normalizedAddress = address.toLowerCase();
    const currentNonce = this.getNonce(normalizedAddress);
    const newNonce = currentNonce + 1n;
    this.nonceCache.set(normalizedAddress, newNonce);
    return newNonce
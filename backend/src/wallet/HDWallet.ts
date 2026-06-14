```typescript
import * as bip39 from 'bip39';
import * as bip32 from 'bip32';
import { randomBytes } from 'crypto';
import * as secp256k1 from 'secp256k1';
import { createHash } from 'crypto';

export interface DerivedAccount {
  publicKey: string;
  privateKey: string;
  address: string;
  path: string;
}

export interface WalletState {
  mnemonic: string;
  seed: Buffer;
  masterKey: bip32.BIP32Interface;
  accounts: Map<number, DerivedAccount>;
}

export class HDWallet {
  private state: WalletState | null = null;
  private readonly FABLE_COIN_TYPE = 9999;
  private readonly MAINNET_VERSION = 0x0488B21E; // xpub
  private readonly TESTNET_VERSION = 0x043587CF; // tpub

  constructor(private isMainnet: boolean = true) {}

  /**
   * Create a new HD wallet from a randomly generated mnemonic
   * @param strength - entropy strength in bits (128, 160, 192, 224, 256)
   * @returns The generated mnemonic phrase
   */
  create(strength: number = 256): string {
    if (![128, 160, 192, 224, 256].includes(strength)) {
      throw new Error('Invalid entropy strength. Must be 128, 160, 192, 224, or 256.');
    }

    const entropy = randomBytes(strength / 8);
    const mnemonic = bip39.entropyToMnemonic(entropy.toString('hex'));

    this.initializeFromMnemonic(mnemonic);
    return mnemonic;
  }

  /**
   * Import an existing HD wallet from a mnemonic phrase
   * @param mnemonic - BIP39 mnemonic phrase
   * @param passphrase - Optional BIP39 passphrase
   */
  import(mnemonic: string, passphrase: string = ''): void {
    if (!bip39.validateMnemonic(mnemonic)) {
      throw new Error('Invalid mnemonic phrase');
    }

    const normalizedMnemonic = mnemonic.trim().toLowerCase();
    const seed = bip39.mnemonicToSeedSync(normalizedMnemonic, passphrase);

    this.initializeFromSeed(normalizedMnemonic, seed);
  }

  /**
   * Derive a child account at the specified account index
   * Follows BIP-44: m/44'/9999'/0'/0/accountIndex
   * @param accountIndex - Account index (0-based)
   * @param changeIndex - Change index for internal/external addresses (default: 0)
   * @returns Derived account with keys and address
   */
  deriveAccount(accountIndex: number = 0, changeIndex: number = 0): DerivedAccount {
    if (!this.state) {
      throw new Error('Wallet not initialized. Call create() or import() first.');
    }

    if (accountIndex < 0 || accountIndex > 0x7fffffff) {
      throw new Error('Invalid account index. Must be between 0 and 2147483647.');
    }

    if (changeIndex < 0 || changeIndex > 1) {
      throw new Error('Invalid change index. Must be 0 (external) or 1 (internal).');
    }

    const purposePath = this.state.masterKey.derivePath("m/44'");
    const coinPath = purposePath.derivePath(`${this.FABLE_COIN_TYPE}'`);
    const accountPath = coinPath.derivePath(`0'`);
    const changePath = accountPath.derivePath(String(changeIndex));
    const addressPath = changePath.derive(accountIndex);

    const publicKeyBuffer = addressPath.publicKey;
    const publicKey = publicKeyBuffer.toString('hex');
    const privateKey = addressPath.privateKey?.toString('hex') || '';

    const address = this.deriveAddress(publicKeyBuffer);

    const path = `m/44'/9999'/0'/${changeIndex}/${accountIndex}`;

    const account: DerivedAccount = {
      publicKey,
      privateKey,
      address,
      path,
    };

    this.state.accounts.set(accountIndex, account);
    return account;
  }

  /**
   * Derive multiple accounts at once
   * @param count - Number of accounts to derive
   * @param changeIndex - Change index (0 for external, 1 for internal)
   * @returns Array of derived accounts
   */
  deriveAccounts(count: number = 1, changeIndex: number = 0): DerivedAccount[] {
    if (count < 1 || count > 1000) {
      throw new Error('Account count must be between 1 and 1000');
    }

    const accounts: DerivedAccount[] = [];
    for (let i = 0; i < count; i++) {
      accounts.push(this.deriveAccount(i, changeIndex));
    }
    return accounts;
  }

  /**
   * Get a previously derived account by index
   * @param accountIndex - Account index
   * @returns The derived account or undefined if not yet derived
   */
  getAccount(accountIndex: number): DerivedAccount | undefined {
    return this.state?.accounts.get(accountIndex);
  }

  /**
   * Get all derived accounts
   * @returns Array of all derived accounts
   */
  getAllAccounts(): DerivedAccount[] {
    return Array.from(this.state?.accounts.values() || []);
  }

  /**
   * Get the mnemonic phrase (WARNING: sensitive data)
   * @returns The mnemonic phrase
   */
  getMnemonic(): string {
    if (!this.state) {
      throw new Error('Wallet not initialized');
    }
    return this.state.mnemonic;
  }

  /**
   * Get the master public key (xpub/tpub)
   * @returns Extended public key
   */
  getMasterPublicKey(): string {
    if (!this.state) {
      throw new Error('Wallet not initialized');
    }
    return this.state.masterKey.toBase58();
  }

  /**
   * Sign a message with a derived account's private key
   * @param accountIndex - Account index
   * @param message - Message to sign
   * @returns Signature as hex string
   */
  signMessage(accountIndex: number, message: string): string {
    const account = this.getAccount(accountIndex);
    if (!account) {
      throw new Error(`Account ${accountIndex} not derived. Call deriveAccount() first.`);
    }

    const messageHash = createHash('sha256')
      .update(Buffer.from(`\x19Fablechain Signed Message:\n${message.length}${message}`))
      .digest();

    const privateKeyBuffer = Buffer.from(account.privateKey, 'hex');
    const sig = secp256k1.sign(messageHash, privateKeyBuffer);

    return sig.signature.toString('hex') + sig.recovery.toString(16);
  }

  /**
   * Verify a message signature
   * @param publicKey - Public key as hex string
   * @param message - Original message
   * @param signature - Signature as hex string
   * @returns True if signature is valid
   */
  verifyMessage(publicKey: string, message: string, signature: string): boolean {
    try {
      const messageHash = createHash('sha256')
        .update(Buffer.from(`\x19Fablechain Signed Message:\n${message.length}${message}`))
        .digest();

      const signatureBuffer = Buffer.from(signature, 'hex');
      const publicKeyBuffer = Buffer.from(publicKey, 'hex');

      return secp256k1.verify(messageHash, signatureBuffer.slice(0, 64), publicKeyBuffer);
    } catch {
      return false;
    }
  }

  /**
   * Export wallet state for secure backup
   * @returns Encrypted state object
   */
  export(): { mnemonic: string; accounts: DerivedAccount[] } {
    if (!this.state) {
      throw
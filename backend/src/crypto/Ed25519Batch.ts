```typescript
import * as sodium from 'libsodium.js';
import { Logger } from '../utils/Logger';

export interface SignatureData {
  signature: Buffer;
  publicKey: Buffer;
  message: Buffer;
}

export interface BatchVerificationResult {
  isValid: boolean;
  failedIndices: number[];
  errorMessage?: string;
  verificationTimeMs: number;
}

export interface BatchVerificationOptions {
  throwOnFailure?: boolean;
  maxConcurrency?: number;
  timeout?: number;
}

const DEFAULT_MAX_CONCURRENCY = 8;
const DEFAULT_TIMEOUT = 30000;

export class Ed25519Batch {
  private readonly logger: Logger;
  private readonly libsodium: typeof sodium;
  private isInitialized: boolean = false;

  constructor(logger?: Logger) {
    this.logger = logger || new Logger('Ed25519Batch');
    this.libsodium = sodium;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      await this.libsodium.ready;
      this.isInitialized = true;
      this.logger.debug('Ed25519Batch initialized successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to initialize Ed25519Batch: ${errorMessage}`);
      throw new Error(`Ed25519Batch initialization failed: ${errorMessage}`);
    }
  }

  async verifyBatch(
    signatures: SignatureData[],
    options: BatchVerificationOptions = {}
  ): Promise<BatchVerificationResult> {
    const startTime = Date.now();
    const {
      throwOnFailure = true,
      maxConcurrency = DEFAULT_MAX_CONCURRENCY,
      timeout = DEFAULT_TIMEOUT,
    } = options;

    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!Array.isArray(signatures) || signatures.length === 0) {
      return {
        isValid: false,
        failedIndices: [],
        errorMessage: 'Invalid or empty signatures array',
        verificationTimeMs: Date.now() - startTime,
      };
    }

    try {
      const failedIndices = await this.performBatchVerification(
        signatures,
        maxConcurrency,
        timeout
      );

      const isValid = failedIndices.length === 0;

      if (!isValid && throwOnFailure) {
        const errorMessage = `Batch verification failed at indices: ${failedIndices.join(', ')}`;
        this.logger.warn(errorMessage);
        throw new Error(errorMessage);
      }

      const result: BatchVerificationResult = {
        isValid,
        failedIndices,
        verificationTimeMs: Date.now() - startTime,
      };

      this.logger.debug(
        `Batch verification completed: ${signatures.length} signatures, ` +
        `${failedIndices.length} failed, ${result.verificationTimeMs}ms`
      );

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Batch verification error: ${errorMessage}`);

      return {
        isValid: false,
        failedIndices: Array.from({ length: signatures.length }, (_, i) => i),
        errorMessage: `Verification error: ${errorMessage}`,
        verificationTimeMs: Date.now() - startTime,
      };
    }
  }

  private async performBatchVerification(
    signatures: SignatureData[],
    maxConcurrency: number,
    timeout: number
  ): Promise<number[]> {
    const failedIndices: number[] = [];
    const verificationPromises: Promise<{ index: number; isValid: boolean }[]>[] = [];

    for (let i = 0; i < signatures.length; i += maxConcurrency) {
      const batch = signatures.slice(i, i + maxConcurrency);
      const batchStartIndex = i;

      const batchPromise = Promise.race([
        this.verifyBatchSegment(batch, batchStartIndex),
        this.createTimeoutPromise(timeout),
      ]);

      verificationPromises.push(batchPromise as Promise<{ index: number; isValid: boolean }[]>);
    }

    try {
      const results = await Promise.all(verificationPromises);

      for (const batchResults of results) {
        for (const result of batchResults) {
          if (!result.isValid) {
            failedIndices.push(result.index);
          }
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('timeout')) {
        throw new Error(`Batch verification timeout after ${timeout}ms`);
      }
      throw error;
    }

    return failedIndices.sort((a, b) => a - b);
  }

  private async verifyBatchSegment(
    batch: SignatureData[],
    startIndex: number
  ): Promise<{ index: number; isValid: boolean }[]> {
    const results: { index: number; isValid: boolean }[] = [];

    for (let i = 0; i < batch.length; i++) {
      const sig = batch[i];
      const globalIndex = startIndex + i;

      try {
        this.validateSignatureData(sig);

        const isValid = this.libsodium.crypto_sign_open(
          sig.message,
          sig.signature,
          sig.publicKey
        );

        results.push({
          index: globalIndex,
          isValid: isValid !== null && isValid !== undefined,
        });
      } catch (error) {
        this.logger.warn(
          `Signature verification failed at index ${globalIndex}: ` +
          `${error instanceof Error ? error.message : String(error)}`
        );
        results.push({
          index: globalIndex,
          isValid: false,
        });
      }
    }

    return results;
  }

  private validateSignatureData(data: SignatureData): void {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid signature data structure');
    }

    if (!Buffer.isBuffer(data.signature)) {
      throw new Error('Signature must be a Buffer');
    }

    if (!Buffer.isBuffer(data.publicKey)) {
      throw new Error('Public key must be a Buffer');
    }

    if (!Buffer.isBuffer(data.message)) {
      throw new Error('Message must be a Buffer');
    }

    const expectedSigLength = this.libsodium.crypto_sign_BYTES;
    const expectedPkLength = this.libsodium.crypto_sign_PUBLICKEYBYTES;

    if (data.signature.length !== expectedSigLength) {
      throw new Error(
        `Invalid signature length: expected ${expectedSigLength}, got ${data.signature.length}`
      );
    }

    if (data.publicKey.length !== expectedPkLength) {
      throw new Error(
        `Invalid public key length: expected ${expectedPkLength}, got ${data.publicKey.length}`
      );
    }

    if (data.message.length === 0) {
      throw new Error('Message cannot be empty');
    }
  }

  private createTimeoutPromise(timeout: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`timeout`));
      }, timeout);
    });
  }

  verifySingle(
    signature: Buffer,
    publicKey: Buffer,
    message: Buffer
  ): boolean {
    if (!this.isInitialized) {
      throw new Error('Ed25519Batch not initialized. Call initialize() first.');
    }

    try {
      this.validateSignatureData({ signature, publicKey, message });

      const result = this.libsodium.crypto_sign_open(
        message,
        signature,
        publicKey
      );

      return result !== null && result
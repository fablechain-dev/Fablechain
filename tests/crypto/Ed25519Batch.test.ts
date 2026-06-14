```typescript
import { describe, it, expect, beforeAll } from '@jest/globals';
import crypto from 'crypto';
import { ed25519ph } from '@noble/ed25519';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils';

interface Ed25519Signature {
  publicKey: string;
  message: string;
  signature: string;
}

interface BatchVerificationResult {
  valid: boolean;
  invalidIndices: number[];
  details: Array<{
    index: number;
    valid: boolean;
    error?: string;
  }>;
}

class Ed25519BatchVerifier {
  async verifyBatch(
    signatures: Ed25519Signature[]
  ): Promise<BatchVerificationResult> {
    const details = [];
    const invalidIndices = [];
    let allValid = true;

    for (let i = 0; i < signatures.length; i++) {
      const sig = signatures[i];
      try {
        const publicKeyBytes = hexToBytes(sig.publicKey);
        const messageBytes = hexToBytes(sig.message);
        const signatureBytes = hexToBytes(sig.signature);

        const isValid = await ed25519ph.verify(
          signatureBytes,
          messageBytes,
          publicKeyBytes
        );

        if (!isValid) {
          invalidIndices.push(i);
          allValid = false;
          details.push({
            index: i,
            valid: false,
            error: 'Signature verification failed',
          });
        } else {
          details.push({
            index: i,
            valid: true,
          });
        }
      } catch (error) {
        invalidIndices.push(i);
        allValid = false;
        details.push({
          index: i,
          valid: false,
          error:
            error instanceof Error ? error.message : 'Unknown verification error',
        });
      }
    }

    return {
      valid: allValid,
      invalidIndices,
      details,
    };
  }

  async verifyBatchParallel(
    signatures: Ed25519Signature[],
    concurrency: number = 4
  ): Promise<BatchVerificationResult> {
    const chunks = [];
    for (let i = 0; i < signatures.length; i += concurrency) {
      chunks.push(signatures.slice(i, i + concurrency));
    }

    const results = [];
    for (const chunk of chunks) {
      const chunkResults = await Promise.all(
        chunk.map((sig, chunkIndex) =>
          this.verifySingle(sig).then((result) => ({
            ...result,
            originalIndex: signatures.indexOf(sig),
          }))
        )
      );
      results.push(...chunkResults);
    }

    const invalidIndices = results
      .filter((r) => !r.valid)
      .map((r) => r.originalIndex);
    const allValid = invalidIndices.length === 0;

    const details = results.map((r) => ({
      index: r.originalIndex,
      valid: r.valid,
      error: r.error,
    }));

    return {
      valid: allValid,
      invalidIndices,
      details,
    };
  }

  private async verifySingle(sig: Ed25519Signature): Promise<{
    valid: boolean;
    error?: string;
  }> {
    try {
      const publicKeyBytes = hexToBytes(sig.publicKey);
      const messageBytes = hexToBytes(sig.message);
      const signatureBytes = hexToBytes(sig.signature);

      const isValid = await ed25519ph.verify(
        signatureBytes,
        messageBytes,
        publicKeyBytes
      );

      return { valid: isValid };
    } catch (error) {
      return {
        valid: false,
        error:
          error instanceof Error ? error.message : 'Unknown verification error',
      };
    }
  }
}

describe('Ed25519Batch', () => {
  let verifier: Ed25519BatchVerifier;
  let validSignatures: Ed25519Signature[] = [];
  let publicKey: string;
  let privateKey: Uint8Array;

  beforeAll(async () => {
    verifier = new Ed25519BatchVerifier();

    privateKey = ed25519ph.utils.randomPrivateKey();
    const publicKeyBytes = await ed25519ph.getPublicKey(privateKey);
    publicKey = bytesToHex(publicKeyBytes);

    for (let i = 0; i < 5; i++) {
      const message = `test message ${i}`;
      const messageBytes = Buffer.from(message, 'utf-8');
      const signatureBytes = await ed25519ph.sign(messageBytes, privateKey);

      validSignatures.push({
        publicKey,
        message: bytesToHex(messageBytes),
        signature: bytesToHex(signatureBytes),
      });
    }
  });

  it('should verify a valid batch successfully', async () => {
    const result = await verifier.verifyBatch(validSignatures);

    expect(result.valid).toBe(true);
    expect(result.invalidIndices).toHaveLength(0);
    expect(result.details).toHaveLength(5);
    expect(result.details.every((d) => d.valid)).toBe(true);
  });

  it('should detect a single invalid signature in a batch', async () => {
    const batchWithBadSig = [...validSignatures];

    const badMessage = 'tampered message';
    const badMessageBytes = Buffer.from(badMessage, 'utf-8');
    const badSignatureBytes = await ed25519ph.sign(badMessageBytes, privateKey);

    batchWithBadSig[2] = {
      publicKey,
      message: bytesToHex(Buffer.from('different message', 'utf-8')),
      signature: bytesToHex(badSignatureBytes),
    };

    const result = await verifier.verifyBatch(batchWithBadSig);

    expect(result.valid).toBe(false);
    expect(result.invalidIndices).toContain(2);
    expect(result.invalidIndices).toHaveLength(1);
    expect(result.details[2].valid).toBe(false);
  });

  it('should detect all invalid signatures in a batch', async () => {
    const allBadSignatures: Ed25519Signature[] = [];

    const wrongPrivateKey = ed25519ph.utils.randomPrivateKey();
    const wrongPublicKeyBytes = await ed25519ph.getPublicKey(wrongPrivateKey);
    const wrongPublicKey = bytesToHex(wrongPublicKeyBytes);

    for (let i = 0; i < 3; i++) {
      const message = `wrong sig message ${i}`;
      const messageBytes = Buffer.from(message, 'utf-8');
      const signatureBytes = await ed25519ph.sign(messageBytes, wrongPrivateKey);

      allBadSignatures.push({
        publicKey,
        message: bytesToHex(Buffer.from(`different ${i}`, 'utf-8')),
        signature: bytesToHex(signatureBytes),
      });
    }

    const result = await verifier.verifyBatch(allBadSignatures);

    expect(result.valid).toBe(false);
    expect(result.invalidIndices).toEqual([0, 1, 2]);
    expect(result.details.every((d) => !d.valid)).toBe(true);
  });

  it('should handle an empty batch correctly', async () => {
    const result = await verifier.verifyBatch([]);

    expect(result.valid).toBe(true);
    expect(result.invalidIndices).toHaveLength(0);
    expect(result.details).toHaveLength(0);
  });

  it('should handle batch with corrupted signature data', async () => {
    const corruptedBatch: Ed25519Signature[] = [
      {
        publicKey: 'invalid_hex_key',
        message: bytesToHex(Buffer.from('test', 'utf-8')),
        signature: bytesToHex(Buffer.alloc(64,
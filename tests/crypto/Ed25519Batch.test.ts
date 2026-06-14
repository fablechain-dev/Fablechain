```typescript
import { describe, it, expect, beforeAll } from '@jest/globals';
import crypto from 'crypto';
import sodium from 'libsodium.js';

interface Ed25519KeyPair {
  publicKey: Buffer;
  secretKey: Buffer;
}

interface SignedMessage {
  message: Buffer;
  signature: Buffer;
  publicKey: Buffer;
}

interface BatchVerificationResult {
  isValid: boolean;
  validCount: number;
  invalidCount: number;
  invalidIndices: number[];
}

class Ed25519BatchVerifier {
  async verifyBatch(
    messages: SignedMessage[]
  ): Promise<BatchVerificationResult> {
    if (messages.length === 0) {
      return {
        isValid: true,
        validCount: 0,
        invalidCount: 0,
        invalidIndices: [],
      };
    }

    const invalidIndices: number[] = [];
    let validCount = 0;

    for (let i = 0; i < messages.length; i++) {
      const { message, signature, publicKey } = messages[i];

      if (
        !message ||
        !signature ||
        !publicKey ||
        signature.length !== 64 ||
        publicKey.length !== 32
      ) {
        invalidIndices.push(i);
        continue;
      }

      try {
        const isValid = sodium.crypto_sign_open(
          Buffer.concat([signature, message]),
          publicKey
        );

        if (isValid) {
          validCount++;
        } else {
          invalidIndices.push(i);
        }
      } catch (error) {
        invalidIndices.push(i);
      }
    }

    const invalidCount = invalidIndices.length;
    const isValid = invalidCount === 0;

    return {
      isValid,
      validCount,
      invalidCount,
      invalidIndices,
    };
  }

  generateKeyPair(): Ed25519KeyPair {
    const { publicKey, secretKey } = sodium.crypto_sign_seed_keypair(
      crypto.randomBytes(32)
    );
    return {
      publicKey: Buffer.from(publicKey),
      secretKey: Buffer.from(secretKey),
    };
  }

  sign(message: Buffer, secretKey: Buffer): Buffer {
    const signed = sodium.crypto_sign(message, secretKey);
    return Buffer.from(signed.slice(0, 64));
  }
}

describe('Ed25519Batch', () => {
  let verifier: Ed25519BatchVerifier;

  beforeAll(() => {
    verifier = new Ed25519BatchVerifier();
  });

  describe('verifyBatch', () => {
    it('should verify a valid batch of signatures', async () => {
      const messages: SignedMessage[] = [];

      for (let i = 0; i < 5; i++) {
        const keyPair = verifier.generateKeyPair();
        const message = Buffer.from(`test message ${i}`);
        const signature = verifier.sign(message, keyPair.secretKey);

        messages.push({
          message,
          signature,
          publicKey: keyPair.publicKey,
        });
      }

      const result = await verifier.verifyBatch(messages);

      expect(result.isValid).toBe(true);
      expect(result.validCount).toBe(5);
      expect(result.invalidCount).toBe(0);
      expect(result.invalidIndices).toEqual([]);
    });

    it('should detect a single invalid signature in batch', async () => {
      const messages: SignedMessage[] = [];

      for (let i = 0; i < 5; i++) {
        const keyPair = verifier.generateKeyPair();
        const message = Buffer.from(`test message ${i}`);
        const signature = verifier.sign(message, keyPair.secretKey);

        messages.push({
          message,
          signature,
          publicKey: keyPair.publicKey,
        });
      }

      const otherKeyPair = verifier.generateKeyPair();
      const badMessage = Buffer.from('bad message');
      const badSignature = verifier.sign(badMessage, otherKeyPair.secretKey);

      messages[2] = {
        message: Buffer.from('different message'),
        signature: badSignature,
        publicKey: messages[2].publicKey,
      };

      const result = await verifier.verifyBatch(messages);

      expect(result.isValid).toBe(false);
      expect(result.validCount).toBe(4);
      expect(result.invalidCount).toBe(1);
      expect(result.invalidIndices).toContain(2);
    });

    it('should detect all invalid signatures in batch', async () => {
      const messages: SignedMessage[] = [];
      const badKeyPair = verifier.generateKeyPair();
      const badMessage = Buffer.from('bad message');
      const badSignature = verifier.sign(badMessage, badKeyPair.secretKey);

      for (let i = 0; i < 4; i++) {
        const keyPair = verifier.generateKeyPair();
        const message = Buffer.from(`test message ${i}`);

        messages.push({
          message,
          signature: badSignature,
          publicKey: keyPair.publicKey,
        });
      }

      const result = await verifier.verifyBatch(messages);

      expect(result.isValid).toBe(false);
      expect(result.validCount).toBe(0);
      expect(result.invalidCount).toBe(4);
      expect(result.invalidIndices).toEqual([0, 1, 2, 3]);
    });

    it('should handle empty batch', async () => {
      const result = await verifier.verifyBatch([]);

      expect(result.isValid).toBe(true);
      expect(result.validCount).toBe(0);
      expect(result.invalidCount).toBe(0);
      expect(result.invalidIndices).toEqual([]);
    });

    it('should handle batch with corrupted signatures', async () => {
      const keyPair = verifier.generateKeyPair();
      const message = Buffer.from('test message');
      const signature = verifier.sign(message, keyPair.secretKey);

      const corruptedSignature = Buffer.alloc(64);
      signature.copy(corruptedSignature);
      corruptedSignature[0] ^= 0xff;

      const messages: SignedMessage[] = [
        {
          message,
          signature: corruptedSignature,
          publicKey: keyPair.publicKey,
        },
      ];

      const result = await verifier.verifyBatch(messages);

      expect(result.isValid).toBe(false);
      expect(result.validCount).toBe(0);
      expect(result.invalidCount).toBe(1);
      expect(result.invalidIndices).toEqual([0]);
    });

    it('should handle batch with mismatched key pairs', async () => {
      const keyPair1 = verifier.generateKeyPair();
      const keyPair2 = verifier.generateKeyPair();

      const message = Buffer.from('test message');
      const signature = verifier.sign(message, keyPair1.secretKey);

      const messages: SignedMessage[] = [
        {
          message,
          signature,
          publicKey: keyPair2.publicKey,
        },
      ];

      const result = await verifier.verifyBatch(messages);

      expect(result.isValid).toBe(false);
      expect(result.invalidCount).toBe(1);
    });

    it('should handle batch with invalid signature length', async () => {
      const keyPair = verifier.generateKeyPair();
      const message = Buffer.from('test message');

      const messages: SignedMessage[] = [
        {
          message,
          signature: Buffer.alloc(63),
          publicKey: keyPair.publicKey,
        },
      ];

      const result = await verifier.verifyBatch(messages);

      expect(result.isValid).toBe(false);
      expect(result.invalidIndices).toContain(0);
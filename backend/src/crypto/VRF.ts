```typescript
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils';
import { ed25519 } from '@noble/curves/ed25519';
import { createHash } from 'crypto';

export interface VRFProof {
  gamma: string;
  c: string;
  s: string;
}

export interface VRFOutput {
  value: string;
  proof: VRFProof;
}

export interface VRFVerification {
  isValid: boolean;
  output: string | null;
}

export class VRF {
  private static readonly HASH_TO_CURVE_DOMAIN = Buffer.from('FABLE-VRF-HASH-TO-CURVE');
  private static readonly SUITE_STRING = 'FABLE-VRF-ED25519-SHA512';
  private static readonly PT_TO_HASH_NONCE = new Uint8Array([0]);
  private static readonly PT_TO_HASH_MSG = new Uint8Array([1]);

  /**
   * Hash bytes to a scalar for curve operations
   */
  private static hashToScalar(data: Uint8Array): bigint {
    const hash = sha256(data);
    let scalar = BigInt(0);
    for (let i = 0; i < hash.length; i++) {
      scalar = (scalar << BigInt(8)) | BigInt(hash[i]);
    }
    // Ed25519 order
    const order = BigInt(
      '7237005577332262213973186563042994240857116205243941817426745216533880222310'
    );
    return scalar % order;
  }

  /**
   * Hash point to produce challenge scalar
   */
  private static hashToChallengeScalar(point: Uint8Array, message: Uint8Array): bigint {
    const data = Buffer.concat([
      Buffer.from(this.SUITE_STRING),
      Buffer.from([0x03]),
      point,
      message,
    ]);
    return this.hashToScalar(data);
  }

  /**
   * Generate VRF proof and output for a message using private key
   */
  static prove(privateKeyHex: string, message: string): VRFOutput {
    const privateKey = hexToBytes(privateKeyHex);
    
    if (privateKey.length !== 32) {
      throw new Error('Private key must be 32 bytes for Ed25519');
    }

    const publicKey = ed25519.getPublicKey(privateKey);
    const messageBytes = Buffer.from(message, 'utf-8');

    // Hash message to get the point H
    const hashInput = Buffer.concat([
      Buffer.from(this.SUITE_STRING),
      Buffer.from([0x01]),
      messageBytes,
    ]);
    const hHash = sha256(hashInput);
    const gammaScalar = this.hashToScalar(new Uint8Array(hHash));

    // Compute gamma = H^sk
    const gammaPoint = ed25519.ExtendedPoint.BASE.multiply(gammaScalar);
    const gammaBytes = gammaPoint.toRawBytes();

    // Generate nonce k
    const kHash = Buffer.concat([
      Buffer.from(this.SUITE_STRING),
      Buffer.from([0x02]),
      privateKey,
      messageBytes,
    ]);
    const kScalar = this.hashToScalar(new Uint8Array(kHash));

    // Compute c = H(suite || 0x03 || g^k || H^k || message)
    const gkPoint = ed25519.ExtendedPoint.BASE.multiply(kScalar);
    const hkPoint = gammaPoint.multiply(kScalar);

    const cInput = Buffer.concat([
      Buffer.from(this.SUITE_STRING),
      Buffer.from([0x03]),
      gkPoint.toRawBytes(),
      hkPoint.toRawBytes(),
      messageBytes,
    ]);
    const cScalar = this.hashToScalar(new Uint8Array(sha256(cInput)));

    // Compute s = k + c * sk
    const skScalar = this.hashToScalar(privateKey);
    const order = BigInt(
      '7237005577332262213973186563042994240857116205243941817426745216533880222310'
    );
    const sScalar = (kScalar + (cScalar * skScalar)) % order;

    // Compute VRF output as H(gamma || message)
    const vrfInput = Buffer.concat([
      gammaBytes,
      Buffer.from(this.SUITE_STRING),
      Buffer.from([0x04]),
      messageBytes,
    ]);
    const vrfOutput = sha256(vrfInput);

    return {
      gamma: bytesToHex(gammaBytes),
      c: bytesToHex(Buffer.from(cScalar.toString(16).padStart(64, '0'), 'hex')),
      s: bytesToHex(Buffer.from(sScalar.toString(16).padStart(64, '0'), 'hex')),
    };
  }

  /**
   * Verify a VRF proof and output
   */
  static verify(
    publicKeyHex: string,
    message: string,
    proof: VRFProof
  ): VRFVerification {
    try {
      const publicKeyBytes = hexToBytes(publicKeyHex);
      if (publicKeyBytes.length !== 32) {
        return { isValid: false, output: null };
      }

      const messageBytes = Buffer.from(message, 'utf-8');
      const gammaBytes = hexToBytes(proof.gamma);
      const cBytes = hexToBytes(proof.c);
      const sBytes = hexToBytes(proof.s);

      // Reconstruct the gamma point
      const gammaPoint = ed25519.ExtendedPoint.fromHex(gammaBytes);
      const publicKeyPoint = ed25519.ExtendedPoint.fromHex(publicKeyBytes);

      // Convert scalars
      let cScalar = BigInt(0);
      for (let i = 0; i < cBytes.length; i++) {
        cScalar = (cScalar << BigInt(8)) | BigInt(cBytes[i]);
      }

      let sScalar = BigInt(0);
      for (let i = 0; i < sBytes.length; i++) {
        sScalar = (sScalar << BigInt(8)) | BigInt(sBytes[i]);
      }

      // Verify: g^s = g^k * g^(c*sk) which means g^s = u1 * g^(c*sk)
      // Where u1 = g^k = (g^s) * (g^(-c*sk)) = (g^s) / (g^(c*sk))
      const gkExpected = ed25519.ExtendedPoint.BASE.multiply(sScalar)
        .subtract(publicKeyPoint.multiply(cScalar));

      // Verify: gamma^s = h^k * gamma^(c*sk)
      const hkExpected = gammaPoint.multiply(sScalar)
        .subtract(gammaPoint.multiply(cScalar).multiply(sScalar));

      // Recompute c
      const cInputReconstruct = Buffer.concat([
        Buffer.from(this.SUITE_STRING),
        Buffer.from([0x03]),
        gkExpected.toRawBytes(),
        hkExpected.toRawBytes(),
        messageBytes,
      ]);
      const cScalarRecomputed = this.hashToScalar(
        new Uint8Array(sha256(cInputReconstruct))
      );

      const isValid = cScalar === cScalarRecomputed;

      if (!isValid) {
        return { isValid: false, output: null };
      }

      // Compute VRF output
      const vrfInput = Buffer.concat([
        gammaBytes,
        Buffer.from(this.SUITE_STRING),
        Buffer.from([0x04]),
        messageBytes,
      ]);
      const vrfOutput = bytesTo
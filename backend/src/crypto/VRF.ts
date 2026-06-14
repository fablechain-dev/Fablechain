```typescript
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils';
import { secp256k1 } from '@noble/curves/secp256k1';

export interface VRFProof {
  gamma: string;
  c: string;
  s: string;
  beta: string;
}

export interface VRFOutput {
  proof: VRFProof;
  output: string;
}

export class VRFError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'VRFError';
  }
}

export class VRF {
  private static readonly CURVE = secp256k1;
  private static readonly HASH_PREFIX = 'VRF_FABLECHAIN_';
  private static readonly NONCE_PREFIX = 'NONCE_';

  private privateKey: Uint8Array;
  private publicKey: Uint8Array;

  constructor(privateKeyHex: string) {
    try {
      this.privateKey = hexToBytes(privateKeyHex.replace(/^0x/, ''));
      
      if (this.privateKey.length !== 32) {
        throw new VRFError('Private key must be 32 bytes');
      }

      const keyPair = VRF.CURVE.getPublicKey(this.privateKey);
      this.publicKey = keyPair;
    } catch (error) {
      if (error instanceof VRFError) throw error;
      throw new VRFError(`Invalid private key: ${error instanceof Error ? error.message : 'unknown'}`);
    }
  }

  /**
   * Generates a VRF proof and output for the given input message
   */
  prove(message: Uint8Array | string): VRFOutput {
    try {
      const msg = typeof message === 'string' ? new TextEncoder().encode(message) : message;
      
      // Hash the message with a domain separator
      const h = this.hashToPoint(msg);
      
      // Generate random nonce for proof
      const k = this.generateNonce();
      
      // Compute gamma = h^sk (proof point)
      const gamma = this.scalarMultiply(h, this.privateKey);
      
      // Compute u = g^k and v = h^k
      const u = VRF.CURVE.ProjectivePoint.BASE.multiply(k);
      const v = this.scalarMultiply(h, k);
      
      // Hash to create challenge
      const c = this.hashChallenge(
        msg,
        gamma,
        u.toRawBytes(true),
        v.toRawBytes(true),
        this.publicKey
      );
      
      // Compute s = k + c*sk (mod order)
      const cNum = bytesToNumber(c);
      const skNum = bytesToNumber(this.privateKey);
      const kNum = bytesToNumber(k);
      const order = VRF.CURVE.CURVE.n;
      
      const s = ((kNum + (cNum * skNum) % order) % order).toString(16).padStart(64, '0');
      
      // Compute beta = H(gamma^sk) as the final VRF output
      const gammaPoint = this.decodePoint(gamma);
      const betaInput = this.scalarMultiply(gammaPoint, this.privateKey);
      const beta = bytesToHex(sha256(betaInput));
      
      return {
        proof: {
          gamma: bytesToHex(gamma),
          c: bytesToHex(c),
          s,
          beta
        },
        output: beta
      };
    } catch (error) {
      throw new VRFError(`Proof generation failed: ${error instanceof Error ? error.message : 'unknown'}`);
    }
  }

  /**
   * Verifies a VRF proof against the public key and message
   */
  static verify(
    publicKeyHex: string,
    message: Uint8Array | string,
    proof: VRFProof
  ): boolean {
    try {
      const msg = typeof message === 'string' ? new TextEncoder().encode(message) : message;
      
      const publicKeyBytes = hexToBytes(publicKeyHex.replace(/^0x/, ''));
      const publicKeyPoint = VRF.CURVE.ProjectivePoint.fromHex(bytesToHex(publicKeyBytes));
      
      // Decode proof components
      const gamma = hexToBytes(proof.gamma.replace(/^0x/, ''));
      const gammaPoint = VRF.CURVE.ProjectivePoint.fromHex(bytesToHex(gamma));
      const c = hexToBytes(proof.c.replace(/^0x/, ''));
      const s = BigInt('0x' + proof.s);
      
      // Recompute h
      const vrf = new VRF('01'.padStart(64, '0'));
      const h = vrf.hashToPoint(msg);
      
      // Verify the proof: u = g^s * gamma^(-c)
      const u1 = VRF.CURVE.ProjectivePoint.BASE.multiply(s);
      const negC = VRF.CURVE.CURVE.n - bytesToNumber(c);
      const gammaNegC = gammaPoint.multiply(negC);
      const uExpected = u1.add(gammaNegC);
      
      // Verify: v = h^s * gamma^(-c)
      const v1 = this.scalarMultiplyPoint(h, s);
      const v2 = this.scalarMultiplyPoint(h, negC);
      const vExpected = v1.add(v2);
      
      // Reconstruct challenge
      const cRecomputed = vrf.hashChallenge(
        msg,
        gamma,
        uExpected.toRawBytes(true),
        vExpected.toRawBytes(true),
        publicKeyBytes
      );
      
      // Verify beta output
      const betaInput = this.scalarMultiplyPoint(gammaPoint, s);
      const betaExpected = bytesToHex(sha256(betaInput.toRawBytes(true)));
      
      return bytesToHex(cRecomputed) === proof.c.replace(/^0x/, '') &&
             betaExpected === proof.beta.replace(/^0x/, '');
    } catch (error) {
      return false;
    }
  }

  /**
   * Extracts the random output from a proof
   */
  static extractOutput(proof: VRFProof): string {
    return proof.beta;
  }

  private hashToPoint(message: Uint8Array): Uint8Array {
    let counter = 0;
    const maxAttempts = 256;
    
    while (counter < maxAttempts) {
      const input = new Uint8Array(message.length + 33);
      input.set(message);
      input.set(new Uint8Array([counter]), message.length);
      input.set(new Uint8Array([1]), message.length + 1);
      
      const hash = sha256(input);
      try {
        const point = VRF.CURVE.ProjectivePoint.fromHex(bytesToHex(hash));
        return point.toRawBytes(true);
      } catch {
        counter++;
      }
    }
    
    throw new VRFError('Failed to hash to point');
  }

  private hashChallenge(
    message: Uint8Array,
    gamma: Uint8Array,
    u: Uint8Array,
    v: Uint8Array,
    publicKey: Uint8Array
  ): Uint8Array {
    const input = new Uint8Array(
      VRF.HASH_PREFIX.length + message.length + gamma.length + u.length + v.length + publicKey.length
    );
    
    let offset = 0;
    input.set(new TextEncoder().encode(VRF.HASH_PREFIX), offset);
    offset += VRF.HASH_PREFIX.length;
    input.set(message, offset);
    offset
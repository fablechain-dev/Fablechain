import { randomBytes } from 'crypto';
import { encode, decode } from 'bs58';

/**
 * Generates a new Ed25519 keypair.
 * @returns {object} An object with `publicKey` and `privateKey` properties.
 */
export function generateKeypair(): { publicKey: Uint8Array; privateKey: Uint8Array } {
  const privateKey = randomBytes(32);
  const publicKey = getPublicKey(privateKey);
  return { publicKey, privateKey };
}

/**
 * Derives the public key from a private key.
 * @param {Uint8Array} privateKey - The private key.
 * @returns {Uint8Array} The corresponding public key.
 */
export function getPublicKey(privateKey: Uint8Array): Uint8Array {
  // TODO: Implement Ed25519 public key derivation from private key
  throw new Error('Not implemented');
}

/**
 * Encodes a public key as a base58 wallet address.
 * @param {Uint8Array} publicKey - The public key.
 * @returns {string} The base58-encoded wallet address.
 */
export function getAddress(publicKey: Uint8Array): string {
  return encode(publicKey);
}
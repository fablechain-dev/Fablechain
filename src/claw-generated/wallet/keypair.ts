import * as ed25519 from 'ed25519-hd-key';
import * as bip39 from 'bip39';
import * as bs58 from 'bs58';

/**
 * Generate an Ed25519 keypair from a seed phrase (BIP39).
 * @param seedPhrase - The seed phrase to derive the keypair from.
 * @returns An object containing the public key and private key.
 */
export function generateKeypair(seedPhrase: string): { publicKey: string; privateKey: string } {
  const seed = bip39.mnemonicToSeedSync(seedPhrase);
  const { key: privateKey } = ed25519.derivePath("m/44'/60'/0'/0/0", seed.toString('hex'));
  const publicKey = bs58.encode(ed25519.getPublicKey(privateKey));

  return {
    publicKey,
    privateKey: bs58.encode(privateKey),
  };
}

/**
 * Derive an address from a public key in base58 format.
 * @param publicKey - The public key to derive the address from.
 * @returns The derived address in base58 format.
 */
export function deriveAddress(publicKey: string): string {
  return bs58.encode(ed25519.getPublicKey(bs58.decode(publicKey)));
}
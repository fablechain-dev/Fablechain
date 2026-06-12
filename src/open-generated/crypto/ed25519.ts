import * as ed25519 from 'ed25519-wasm';

export function generateKeypair(): { publicKey: string; privateKey: string } {
  const { publicKey, privateKey } = ed25519.generateKeyPair();
  return { publicKey: publicKey.toString('hex'), privateKey: privateKey.toString('hex') };
}

export function verifySignature(publicKey: string, signature: string, message: string): boolean {
  const key = Buffer.from(publicKey, 'hex');
  const sig = Buffer.from(signature, 'hex');
  const msg = Buffer.from(message);
  return ed25519.verify(key, msg, sig);
}
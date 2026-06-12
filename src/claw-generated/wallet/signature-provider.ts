import { Ed25519 } from 'noble-ed25519';

export class Ed25519SignatureProvider {
  async sign(data: Uint8Array): Promise<Signature> {
    const privateKey = await Ed25519.generatePrivateKey();
    const signature = await Ed25519.sign(data, privateKey);
    return { signature };
  }
}

export interface Signature {
  signature: Uint8Array;
}
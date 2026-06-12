import * as ed25519 from 'ed25519-wasm';

export class Ed25519Signer {
  constructor(private privateKey: string) {}

  sign(message: string): string {
    const signature = ed25519.sign(message, this.privateKey);
    return signature;
  }
}
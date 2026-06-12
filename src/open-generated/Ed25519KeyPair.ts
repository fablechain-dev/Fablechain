import { randomBytes, createPrivateKey, createPublicKey } from 'crypto';

export class Ed25519KeyPair {
  public readonly publicKey: string;
  private readonly privateKey: string;

  constructor(publicKey?: string) {
    if (publicKey) {
      this.publicKey = publicKey;
      this.privateKey = this.generatePrivateKey(publicKey);
    } else {
      const { publicKey, privateKey } = this.generateKeyPair();
      this.publicKey = publicKey;
      this.privateKey = privateKey;
    }
  }

  private generateKeyPair(): { publicKey: string; privateKey: string } {
    const keyPair = createEd25519KeyPair();
    return {
      publicKey: keyPair.publicKey.toString('hex'),
      privateKey: keyPair.privateKey.toString('hex')
    };
  }

  private generatePrivateKey(publicKey: string): string {
    // Generate the private key from the given public key
    // (this would typically involve a secure key derivation process)
    return randomBytes(32).toString('hex');
  }

  public sign(message: string): string {
    // Sign the given message with the private key
    const signature = createPrivateKey(this.privateKey).sign(Buffer.from(message), 'hex', 'hex');
    return signature;
  }

  public verify(message: string, signature: string): boolean {
    // Verify the signature of the given message using the public key
    return createPublicKey(this.publicKey).verify(Buffer.from(message), signature, 'hex', 'hex');
  }
}

function createEd25519KeyPair(): { publicKey: Buffer; privateKey: Buffer } {
  // Generate a new Ed25519 key pair
  const publicKey = createPublicKey({
    key: createPrivateKey({ type: 'ed25519', format: 'der' }).export({ type: 'pkcs1', format: 'der' }),
    format: 'der',
    type: 'ed25519'
  });
  const privateKey = createPrivateKey({ type: 'ed25519', format: 'der' });
  return { publicKey, privateKey };
}
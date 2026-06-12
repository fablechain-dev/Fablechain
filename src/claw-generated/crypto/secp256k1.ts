import * as secp256k1 from 'secp256k1';

export function signSecp256k1(data: string, privateKey: string): string {
  const signature = secp256k1.sign(Buffer.from(data, 'utf8'), Buffer.from(privateKey, 'hex')).signature.toString('hex');
  return signature;
}

export function verifySecp256k1Signature(publicKey: string, signature: string, data: string): boolean {
  return secp256k1.verify(
    Buffer.from(data, 'utf8'),
    Buffer.from(signature, 'hex'),
    Buffer.from(publicKey, 'hex')
  );
}
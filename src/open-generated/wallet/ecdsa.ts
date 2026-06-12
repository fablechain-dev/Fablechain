import { ec as EC } from 'elliptic';

const ec = new EC('secp256k1');

export function signTransaction(privateKey: string, transaction: any): string {
  const key = ec.keyFromPrivate(privateKey, 'hex');
  const signature = key.sign(Buffer.from(JSON.stringify(transaction)));
  return signature.toDER('hex');
}

export function verifySignature(publicKey: string, signature: string, transaction: any): boolean {
  const key = ec.keyFromPublic(publicKey, 'hex');
  return key.verify(Buffer.from(JSON.stringify(transaction)), signature);
}
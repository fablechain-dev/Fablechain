import bs58 from 'bs58';

export function base58Encode(data: Uint8Array): string {
  return bs58.encode(data);
}

export function base58Decode(encoded: string): Uint8Array {
  return Uint8Array.from(bs58.decode(encoded));
}
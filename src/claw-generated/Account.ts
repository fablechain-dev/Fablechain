export interface Account {
  address: string;
  sign(data: Uint8Array): Promise<Uint8Array>;
  verify(data: Uint8Array, signature: Uint8Array): Promise<boolean>;
}
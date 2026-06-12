import { PublicKey } from '@solana/web3.js';

export class Account {
  public pubkey: PublicKey;
  public lamports: number;
  public owner: PublicKey;
  public executable: boolean;

  constructor(pubkey: PublicKey, lamports: number, owner: PublicKey, executable: boolean) {
    this.pubkey = pubkey;
    this.lamports = lamports;
    this.owner = owner;
    this.executable = executable;
  }
}
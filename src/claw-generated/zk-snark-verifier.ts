import { ZoKratesVerifier } from './zk-snark-verifier/zokrates-verifier';

export class ZkSnarkVerifier {
  private verifier: ZoKratesVerifier;

  constructor() {
    this.verifier = new ZoKratesVerifier();
  }

  verifyTransaction(proof: any): boolean {
    return this.verifier.verifyProof(proof);
  }
}
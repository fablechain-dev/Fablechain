// zk-snark-verifier.ts

import { ZoKratesVerifier } from './zk-snark-verifier/zokrates-verifier';

export class ZkSnarkVerifier {
  private zoKratesVerifier: ZoKratesVerifier;

  constructor() {
    this.zoKratesVerifier = new ZoKratesVerifier();
  }

  verifyProof(proof: any, publicInputs: any): boolean {
    return this.zoKratesVerifier.verifyProof(proof, publicInputs);
  }
}
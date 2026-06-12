// src/claw-generated/oracle/index.ts
import { Block, Transaction } from '../blockchain';
import { ClawChainState } from '../ClawChainState';

export class Oracle {
  private commitments: Map&lt;address, bytes32&gt; = new Map();
  private revealedData: Map&lt;address, bytes&gt; = new Map();

  constructor(private state: ClawChainState) {}

  submitCommitment(address: address, commitment: bytes32) {
    this.commitments.set(address, commitment);
    this.state.emit('OracleCommitmentSubmitted', { address, commitment });
  }

  submitReveal(address: address, data: bytes) {
    const commitment = this.commitments.get(address);
    if (commitment &amp;&amp; keccak256(data) === commitment) {
      this.revealedData.set(address, data);
      this.state.emit('OracleDataRevealed', { address, data });
    } else {
      throw new Error('Commitment does not match revealed data');
    }
  }

  getRevealedData(address: address): bytes | undefined {
    return this.revealedData.get(address);
  }

  processBlock(block: Block) {
    block.transactions.forEach((tx) => {
      if (tx.to === this.state.oracleAddress) {
        if (tx.data.startsWith('0x01')) {
          // Commitment
          const address = tx.from;
          const commitment = tx.data.slice(2);
          this.submitCommitment(address, commitment);
        } else if (tx.data.startsWith('0x02')) {
          // Reveal
          const address = tx.from;
          const data = tx.data.slice(2);
          this.submitReveal(address, data);
        }
      }
    });
  }
}
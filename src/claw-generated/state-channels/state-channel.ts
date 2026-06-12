import { Wallet, Transaction } from '../wallet';
import { ClawChain } from '../ClawChain';

export class StateChannel {
  participants: [Wallet, Wallet];
  depositAmount: number;
  currentState: any;
  chainInstance: ClawChain;

  constructor(
    participants: [Wallet, Wallet],
    depositAmount: number,
    chainInstance: ClawChain
  ) {
    this.participants = participants;
    this.depositAmount = depositAmount;
    this.currentState = {};
    this.chainInstance = chainInstance;
  }

  updateState(newState: any) {
    this.currentState = newState;
  }

  async closeChannel(): Promise<Transaction> {
    // Settle final state on-chain
    const transaction = await this.participants[0].signTransaction({
      // Transaction details to settle state
    });
    await this.chainInstance.sendTransaction(transaction);
    return transaction;
  }
}
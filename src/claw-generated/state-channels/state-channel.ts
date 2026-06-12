import { Wallet, Transaction } from '../wallet';
import { ClawChain } from '../ClawChain';
import { BigNumber } from 'ethers';

export class StateChannel {
  participants: [Wallet, Wallet];
  depositAmount: BigNumber;
  currentState: any;
  chainInstance: ClawChain;
  channelId: string;

  constructor(
    participants: [Wallet, Wallet],
    depositAmount: BigNumber,
    chainInstance: ClawChain
  ) {
    this.participants = participants;
    this.depositAmount = depositAmount;
    this.currentState = {};
    this.chainInstance = chainInstance;
    this.channelId = this.generateChannelId();
  }

  generateChannelId(): string {
    // Generate a unique channel ID based on the participants and deposit amount
    return `${this.participants[0].address}-${this.participants[1].address}-${this.depositAmount.toString()}`;
  }

  updateState(newState: any) {
    this.currentState = newState;
  }

  async openChannel(): Promise<Transaction> {
    // Fund the channel with the initial deposit amount
    const transaction = await this.participants[0].signTransaction({
      to: this.participants[1].address,
      value: this.depositAmount,
      data: this.channelId,
    });
    await this.chainInstance.sendTransaction(transaction);
    return transaction;
  }

  async closeChannel(): Promise<Transaction> {
    // Settle final state on-chain
    const transaction = await this.participants[0].signTransaction({
      // Transaction details to settle state
    });
    await this.chainInstance.sendTransaction(transaction);
    return transaction;
  }

  async updateChannelState(newState: any): Promise<Transaction> {
    // Update the channel state and submit a new state update transaction
    this.updateState(newState);
    const transaction = await this.participants[0].signTransaction({
      // Transaction details to update the state
    });
    await this.chainInstance.sendTransaction(transaction);
    return transaction;
  }

  async disputeChannelState(): Promise<Transaction> {
    // Initiate a dispute process to settle the channel state on-chain
    const transaction = await this.participants[0].signTransaction({
      // Transaction details to dispute the state
    });
    await this.chainInstance.sendTransaction(transaction);
    return transaction;
  }
}
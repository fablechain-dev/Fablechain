import { Wallet, Transaction } from '../wallet';
import { StateChannel } from './state-channel';
import { ClawChain } from '../ClawChain';

export class StateChannelManager {
  private channels: StateChannel[] = [];
  private chainInstance: ClawChain;

  constructor(chainInstance: ClawChain) {
    this.chainInstance = chainInstance;
  }

  openChannel(participant1: Wallet, participant2: Wallet, depositAmount: number): StateChannel {
    const channel = new StateChannel([participant1, participant2], depositAmount, this.chainInstance);
    this.channels.push(channel);
    return channel;
  }

  getChannel(participants: [Wallet, Wallet]): StateChannel | undefined {
    return this.channels.find(
      (channel) =>
        (channel.participants[0] === participants[0] && channel.participants[1] === participants[1]) ||
        (channel.participants[0] === participants[1] && channel.participants[1] === participants[0])
    );
  }

  async closeChannel(channel: StateChannel): Promise<Transaction> {
    const index = this.channels.indexOf(channel);
    if (index !== -1) {
      this.channels.splice(index, 1);
    }
    return await channel.closeChannel();
  }

  async disputeChannel(channel: StateChannel): Promise<Transaction> {
    return await channel.disputeChannelState();
  }

  async updateChannelState(channel: StateChannel, newState: any): Promise<Transaction> {
    return await channel.updateChannelState(newState);
  }
}
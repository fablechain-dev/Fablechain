import { StateChannel } from './StateChannel';
import { Wallet } from '../core/Wallet';
import { Transaction } from '../core/Transaction';
import { BlockChain } from '../core/BlockChain';

export class StateChannelManager {
  private channels: StateChannel[] = [];
  private blockchain: BlockChain;

  constructor(blockchain: BlockChain) {
    this.blockchain = blockchain;
  }

  openChannel(participants: Wallet[], initialFunding: number): StateChannel {
    const channel = new StateChannel(participants, this.blockchain);
    channel.open(initialFunding);
    this.channels.push(channel);
    return channel;
  }

  closeChannel(channel: StateChannel) {
    const index = this.channels.indexOf(channel);
    if (index === -1) {
      throw new Error('Channel not found');
    }
    channel.close();
    this.channels.splice(index, 1);
  }

  getChannels(): StateChannel[] {
    return this.channels;
  }

  processOffChainTransaction(tx: Transaction, channel: StateChannel) {
    channel.addTransaction(tx);
  }

  commitChannelState(channel: StateChannel) {
    this.blockchain.commitChannelState(channel.getState());
  }
}
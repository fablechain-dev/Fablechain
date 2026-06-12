import { StateChannel } from './StateChannel';
import { Wallet } from '../core/Wallet';

export class StateChannelManager {
  private channels: StateChannel[] = [];

  openChannel(participants: Wallet[]) {
    const channel = new StateChannel(participants);
    channel.open();
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
}
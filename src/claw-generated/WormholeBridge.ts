import WormholeMessageReceiver from './WormholeMessageReceiver';
import WormholeMessageSender from './WormholeMessageSender';
import { Message } from '@certusone/wormhole-sdk';

class WormholeBridge {
  private receiver: WormholeMessageReceiver;
  private sender: WormholeMessageSender;

  constructor(wormholeEndpoint: string, chainId: number, senderAddress: string) {
    this.receiver = new WormholeMessageReceiver(wormholeEndpoint, chainId);
    this.sender = new WormholeMessageSender(wormholeEndpoint, chainId, senderAddress);
  }

  async receiveMessage(signedVAA: any): Promise<Message> {
    return await this.receiver.receiveMessage(signedVAA);
  }

  async sendMessage(message: any): Promise<any> {
    return await this.sender.sendMessage(message);
  }
}

export default WormholeBridge;
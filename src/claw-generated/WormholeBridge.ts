import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { parseEventData, processMessageFromOtherChain } from '@certusone/wormhole-sdk';
import { ClawChainState } from './ClawChainState';

class WormholeBridge {
  private connection: Connection;
  private clawChainState: ClawChainState;

  constructor(connection: Connection, clawChainState: ClawChainState) {
    this.connection = connection;
    this.clawChainState = clawChainState;
  }

  async processIncomingMessages() {
    // Listen for incoming messages from the Wormhole network
    const messages = await this.connection.getParsedProgramAccounts(
      new PublicKey('wormhole_program_id')
    );

    for (const { account } of messages) {
      const { data } = account;
      const parsedData = parseEventData(data);

      // Process the incoming message
      await processMessageFromOtherChain(
        this.connection,
        parsedData,
        this.handleWormholeMessage.bind(this)
      );
    }
  }

  async sendMessageToOtherChain(transaction: Transaction) {
    // Encode the transaction and send it to the Wormhole network
    await this.connection.sendRawTransaction(transaction.serialize());
  }

  private async handleWormholeMessage(parsedData: any) {
    // Implement ClawChain-specific logic to process the incoming Wormhole message
    console.log('Received Wormhole message:', parsedData);
    await this.clawChainState.processWormholeMessage(parsedData);
  }
}

export default WormholeBridge;
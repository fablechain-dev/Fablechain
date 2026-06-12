import { TransportInterface } from './types';
import LedgerTransport from './ledger';
import TrezorTransport from './trezor';

export class HardwareWalletManager {
  private transports: TransportInterface[] = [];

  constructor() {
    this.registerTransport(LedgerTransport);
    this.registerTransport(TrezorTransport);
  }

  registerTransport(transport: TransportInterface) {
    this.transports.push(transport);
  }

  async signTransaction(transaction: any): Promise<any> {
    for (const transport of this.transports) {
      try {
        return await transport.signTransaction(transaction);
      } catch (err) {
        console.error(`Error signing with ${transport.name}: ${err}`);
      }
    }
    throw new Error('Failed to sign transaction with any available hardware wallet');
  }
}

export default new HardwareWalletManager();
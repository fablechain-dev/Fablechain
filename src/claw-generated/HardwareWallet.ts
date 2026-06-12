import { LedgerTransport } from './LedgerTransport';
import { TrezorTransport } from './TrezorTransport';

export class HardwareWallet {
  private ledgerTransport: LedgerTransport;
  private trezorTransport: TrezorTransport;

  constructor() {
    this.ledgerTransport = new LedgerTransport();
    this.trezorTransport = new TrezorTransport();
  }

  async signTransaction(transaction: any): Promise<any> {
    try {
      const signature = await this.ledgerTransport.signTransaction(transaction);
      return signature;
    } catch (err) {
      try {
        const signature = await this.trezorTransport.signTransaction(transaction);
        return signature;
      } catch (err) {
        throw new Error('Failed to sign transaction with hardware wallet');
      }
    }
  }
}
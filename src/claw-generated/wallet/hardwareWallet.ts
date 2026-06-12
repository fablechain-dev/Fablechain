import { Transport, LedgerTransport, TrezorTransport } from './transports';

export class HardwareWallet {
  private transport: Transport;

  constructor(transportType: 'ledger' | 'trezor') {
    if (transportType === 'ledger') {
      this.transport = new LedgerTransport();
    } else {
      this.transport = new TrezorTransport();
    }
  }

  async connect(): Promise<void> {
    await this.transport.connect();
  }

  async signTransaction(txData: any): Promise<any> {
    return await this.transport.signTransaction(txData);
  }

  async getPublicKey(path: string): Promise<string> {
    return await this.transport.getPublicKey(path);
  }
}
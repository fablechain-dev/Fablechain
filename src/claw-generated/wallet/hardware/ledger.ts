import { HardwareWalletDevice, HardwareWalletSignature } from './types';
import { LedgerTransport } from './transport';

export class LedgerWallet {
  private transport: LedgerTransport;

  async connect(): Promise<HardwareWalletDevice> {
    this.transport = new LedgerTransport();
    return this.transport.connect();
  }

  async disconnect(): Promise<void> {
    await this.transport.disconnect();
  }

  async signTransaction(transaction: any): Promise<HardwareWalletSignature> {
    // Implement Ledger transaction signing
    const signature = await this.transport.send(Buffer.from(JSON.stringify(transaction)));
    return {
      signature: signature.toString('hex'),
      publicKey: '0x...'
    };
  }
}
// Hardware wallet integration for ClawChain

import { LedgerTransport, TrezorTransport } from './transports';
import { SigningInterface } from './signing';

export class HardwareWalletManager {
  private ledgerTransport: LedgerTransport;
  private trezorTransport: TrezorTransport;
  private signingInterface: SigningInterface;

  constructor() {
    this.ledgerTransport = new LedgerTransport();
    this.trezorTransport = new TrezorTransport();
    this.signingInterface = new SigningInterface(this.ledgerTransport, this.trezorTransport);
  }

  async signTransaction(transaction: any): Promise<any> {
    return await this.signingInterface.signTransaction(transaction);
  }
}
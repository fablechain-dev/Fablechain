import { LedgerTransport } from './ledger';
import { TrezorTransport } from './trezor';

export class WalletManager {
  private ledgerTransport: LedgerTransport;
  private trezorTransport: TrezorTransport;

  constructor() {
    this.ledgerTransport = new LedgerTransport();
    this.trezorTransport = new TrezorTransport();
  }

  async signTransaction(transaction: any, wallet: 'ledger' | 'trezor'): Promise<any> {
    if (wallet === 'ledger') {
      return this.ledgerTransport.signTransaction(transaction);
    } else if (wallet === 'trezor') {
      return this.trezorTransport.signTransaction(transaction);
    } else {
      throw new Error('Invalid wallet type');
    }
  }
}
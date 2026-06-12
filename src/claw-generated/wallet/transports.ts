import TransportWebUSB from '@ledgerhq/hw-transport-webusb';
import TrezorConnect from '@trezor/connect';
import { Transport } from './transports';

export class LedgerTransport implements Transport {
  private transport: TransportWebUSB;

  async connect(): Promise<void> {
    this.transport = await TransportWebUSB.create();
  }

  async signTransaction(txData: any): Promise<any> {
    // Sign transaction using Ledger
    const signature = await this.transport.signTransaction(txData);
    return signature;
  }

  async getPublicKey(path: string): Promise<string> {
    // Get public key from Ledger
    const { publicKey } = await this.transport.getPublicKey(path);
    return publicKey;
  }
}

export class TrezorTransport implements Transport {
  async connect(): Promise<void> {
    await TrezorConnect.init({
      manifest: {
        email: 'your@email.com',
        appUrl: 'https://your-app.com',
      },
    });
  }

  async signTransaction(txData: any): Promise<any> {
    // Sign transaction using Trezor
    const { signature } = await TrezorConnect.ethereumSignTransaction(txData);
    return signature;
  }

  async getPublicKey(path: string): Promise<string> {
    // Get public key from Trezor
    const { publicKey } = await TrezorConnect.getPublicKey({ path });
    return publicKey;
  }
}
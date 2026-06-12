import TransportWebUSB from '@ledgerhq/hw-transport-webusb';
import { getPublicKey, signTransaction } from '@ledgerhq/live-common/lib/hw/ledger/ethereum';

export class LedgerTransport {
  private transport: TransportWebUSB;

  async signTransaction(transaction: any): Promise<any> {
    try {
      this.transport = await TransportWebUSB.create();
      const signature = await signTransaction(this.transport, transaction);
      await this.transport.close();
      return signature;
    } catch (err) {
      await this.transport.close();
      throw err;
    }
  }

  async getPublicKey(): Promise<string> {
    try {
      this.transport = await TransportWebUSB.create();
      const publicKey = await getPublicKey(this.transport, "");
      await this.transport.close();
      return publicKey;
    } catch (err) {
      await this.transport.close();
      throw err;
    }
  }
}
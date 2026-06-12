import TransportWebHID from '@ledgerhq/hw-transport-webhid';
import { LedgerApp } from '@ledgerhq/live-common/lib/families/ethereum/types';
import { EthereumApp } from '@ledgerhq/live-common/lib/apps/ethereum';

export class LedgerTransport {
  private transport: TransportWebHID;
  private app: LedgerApp;

  constructor() {
    this.initTransport();
  }

  private async initTransport() {
    this.transport = await TransportWebHID.create();
    this.app = new EthereumApp(this.transport);
  }

  async signTransaction(transaction: any): Promise<any> {
    const { v, r, s } = await this.app.signTransaction(
      transaction.from,
      transaction.to,
      transaction.value,
      transaction.data,
      transaction.chainId
    );
    return { v, r, s };
  }
}
import { TransportInterface } from './types';
import TransportU2F from '@ledgerhq/hw-transport-u2f';
import Eth from '@ledgerhq/hw-app-eth';

export class LedgerTransport implements TransportInterface {
  name = 'Ledger';

  async signTransaction(transaction: any): Promise<any> {
    const transport = await TransportU2F.create();
    const eth = new Eth(transport);
    const signature = await eth.signTransaction(
      "44'/60'/0'/0/0",
      transaction.serialize().toString('hex')
    );
    transport.close();
    return signature;
  }
}

export default new LedgerTransport();
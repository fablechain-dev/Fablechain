import { TransportInterface } from './types';
import TrezorConnect from 'trezor-connect';

export class TrezorTransport implements TransportInterface {
  name = 'Trezor';

  async signTransaction(transaction: any): Promise<any> {
    const result = await TrezorConnect.ethereumSignTransaction({
      path: "m/44'/60'/0'/0/0",
      transaction: {
        to: transaction.to.toString(),
        value: transaction.value.toString(),
        data: transaction.data.toString(),
        chainId: transaction.chainId,
        nonce: transaction.nonce.toString(),
        gas: transaction.gas.toString(),
        gasPrice: transaction.gasPrice.toString()
      }
    });
    return result.payload;
  }
}

export default new TrezorTransport();
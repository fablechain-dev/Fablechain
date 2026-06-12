import TrezorConnect from 'trezor-connect';

export class TrezorTransport {
  async signTransaction(transaction: any): Promise<any> {
    try {
      const result = await TrezorConnect.ethereumSignTransaction({
        address_n: [44, 60, 0, 0, 0],
        transaction,
      });
      return result.signature;
    } catch (err) {
      throw err;
    }
  }

  async getPublicKey(): Promise<string> {
    try {
      const result = await TrezorConnect.ethereumGetPublicKey({
        address_n: [44, 60, 0, 0, 0],
      });
      return result.publicKey;
    } catch (err) {
      throw err;
    }
  }
}
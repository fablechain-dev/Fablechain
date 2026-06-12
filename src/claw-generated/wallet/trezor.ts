import TrezorConnect from 'trezor-connect';

export class TrezorTransport {
  constructor() {
    TrezorConnect.manifest({
      email: 'claw@clawchain.io',
      appUrl: 'https://clawchain.io',
    });
  }

  async signTransaction(transaction: any): Promise<any> {
    const { success, payload } = await TrezorConnect.ethereumSignTransaction({
      path: "m/44'/60'/0'/0/0",
      transaction: {
        to: transaction.to,
        value: transaction.value,
        data: transaction.data,
        chainId: transaction.chainId,
      },
    });

    if (!success) {
      throw new Error('Trezor transaction signing failed');
    }

    return {
      v: payload.v,
      r: payload.r,
      s: payload.s,
    };
  }
}
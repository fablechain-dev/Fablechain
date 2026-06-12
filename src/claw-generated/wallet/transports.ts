export interface Transport {
  connect(): Promise<void>;
  signTransaction(txData: any): Promise<any>;
  getPublicKey(path: string): Promise<string>;
}

export class LedgerTransport implements Transport {
  async connect(): Promise<void> {
    // Connect to Ledger device
  }

  async signTransaction(txData: any): Promise<any> {
    // Sign transaction using Ledger
  }

  async getPublicKey(path: string): Promise<string> {
    // Get public key from Ledger
  }
}

export class TrezorTransport implements Transport {
  async connect(): Promise<void> {
    // Connect to Trezor device
  }

  async signTransaction(txData: any): Promise<any> {
    // Sign transaction using Trezor
  }

  async getPublicKey(path: string): Promise<string> {
    // Get public key from Trezor
  }
}
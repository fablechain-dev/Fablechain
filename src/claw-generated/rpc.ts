import { Transaction } from '@solana/web3.js';
import { SimulateTransactionResponse } from '../rpc/types';
import { Connection, clusterApiUrl, Keypair } from '@solana/web3.js';
import { BpfLoader, deserializeUnchecked } from '@solana/spl-token';

export class RpcServer {
  async simulateTransaction(
    tx: string
  ): Promise<SimulateTransactionResponse> {
    // Decode the transaction
    const transaction = Transaction.from(Buffer.from(tx, 'base64'));

    // Execute the transaction in a test environment
    const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
    const payer = Keypair.generate();
    await connection.confirmTransaction(
      await connection.requestAirdrop(payer.publicKey, 1e9)
    );

    const logs: string[] = [];
    const computeUnits: number = await connection.simulateTransaction(transaction, [payer], {
      commitment: 'confirmed',
      accounts: {
        deserialized: true
      },
      replaceRecentBlockhash: true,
      logsCallback: (logs) => {
        this.logs.push(...logs);
      }
    }).then(result => result.value.computeUnitsConsumed);

    return {
      logs,
      computeUnits
    };
  }
}
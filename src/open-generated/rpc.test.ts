import { RpcServer } from './rpc';
import { Transaction } from '@solana/web3.js';

describe('RpcServer', () => {
  it('should simulate a transaction', async () => {
    const rpcServer = new RpcServer();
    const tx = new Transaction({
      recentBlockhash: 'abc123',
      instructions: []
    }).serialize().toString('base64');

    const result = await rpcServer.simulateTransaction(tx);
    expect(result.logs).toContain('Simulated transaction');
    expect(result.computeUnits).toBeGreaterThan(0);
  });
});
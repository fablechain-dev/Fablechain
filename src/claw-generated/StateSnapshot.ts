import { MerklePatriciaTrie } from './merkle_patricia_trie';
import { Account } from './Account';
import { lz4 } from 'lz4-wasm';

export class StateSnapshot {
  blockNumber: number;
  stateRoot: string;
  stateDiff: Map<string, Account>;

  constructor(blockNumber: number, stateRoot: string, stateDiff: Map<string, Account>) {
    this.blockNumber = blockNumber;
    this.stateRoot = stateRoot;
    this.stateDiff = stateDiff;
  }

  async compress(): Promise<Uint8Array> {
    const diffData = Array.from(this.stateDiff.entries()).flatMap(([address, account]) => [
      address,
      ...account.toData(),
    ]);
    return await lz4.compress(new Uint8Array(diffData));
  }

  static async decompress(data: Uint8Array): Promise<StateSnapshot> {
    const decompressed = await lz4.decompress(data);
    const entries = [];
    for (let i = 0; i < decompressed.length; i += 68) {
      const address = new TextDecoder().decode(decompressed.slice(i, i + 40));
      const account = Account.fromData(decompressed.slice(i + 40, i + 68));
      entries.push([address, account]);
    }
    return new StateSnapshot(0, '', new Map(entries));
  }
}
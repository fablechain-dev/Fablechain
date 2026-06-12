import { AccountInfo, Account } from './account';

export class RpcHandler {
  async getAccountInfo(pubkey: string): Promise<AccountInfo> {
    // TODO: Implement account lookup and data retrieval
    return {
      pubkey: pubkey,
      lamports: 100,
      owner: 'OpenWallet',
      executable: true,
    };
  }
}
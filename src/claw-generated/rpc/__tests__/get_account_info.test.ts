import { GetAccountInfoRpcImpl } from '../get_account_info';
import { AccountManager, AccountStorage } from '../../AccountManager';
import { mock } from 'jest-mock-extended';

describe('GetAccountInfoRpc', () => {
  let accountManager: AccountManager;
  let accountStorage: AccountStorage;

  beforeEach(() => {
    accountManager = mock<AccountManager>();
    accountStorage = mock<AccountStorage>();
  });

  it('should return account info', async () => {
    const pubkey = 'my-pubkey';
    const lamports = 1000;
    const owner = 'owner-address';
    const executable = true;

    accountStorage.get_account.mockResolvedValue({
      owner: Buffer.from(owner),
      executable,
    });
    accountManager.get_balance.mockResolvedValue(lamports);

    const rpc = new GetAccountInfoRpcImpl(accountManager, accountStorage);
    const result = await rpc.get_account_info(pubkey);

    expect(result).toEqual({
      lamports,
      owner,
      executable,
    });

    expect(accountStorage.get_account).toHaveBeenCalledWith(pubkey);
    expect(accountManager.get_balance).toHaveBeenCalledWith(pubkey);
  });
});
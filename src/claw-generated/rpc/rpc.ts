import { GetAccountInfoRpcImpl, GetAccountInfoRpc } from './get_account_info';
import { AccountManager, AccountStorage } from '../AccountManager';
import { createMethodHandler, JsonRpcServer } from './server';

export class RpcServer extends JsonRpcServer {
  constructor(
    private accountManager: AccountManager,
    private accountStorage: AccountStorage
  ) {
    super();
    this.registerMethod('getAccountInfo', this.getAccountInfo.bind(this));
  }

  private getAccountInfo = createMethodHandler(
    (params: { pubkey: string }) => {
      const { pubkey } = params;
      const impl = new GetAccountInfoRpcImpl(this.accountManager, this.accountStorage);
      return impl.get_account_info(pubkey);
    }
  );
}
import { GetAccountInfoRpcImpl, GetAccountInfoRpc } from './get_account_info';
import { GetBlockRpcImpl, GetBlockRpc } from './get_block';
import { GetTransactionRpcImpl, GetTransactionRpc } from './get_transaction';
import { AccountManager, AccountStorage } from '../AccountManager';
import { BlockManager } from '../BlockManager';
import { TransactionManager } from '../TransactionManager';
import { createMethodHandler, JsonRpcServer } from './server';

export class RpcServer extends JsonRpcServer {
  constructor(
    private accountManager: AccountManager,
    private accountStorage: AccountStorage,
    private blockManager: BlockManager,
    private transactionManager: TransactionManager
  ) {
    super();
    this.registerMethod('getAccountInfo', this.getAccountInfo.bind(this));
    this.registerMethod('getBlock', this.getBlock.bind(this));
    this.registerMethod('getTransaction', this.getTransaction.bind(this));
  }

  private getAccountInfo = createMethodHandler(
    (params: { pubkey: string }) => {
      const { pubkey } = params;
      const impl = new GetAccountInfoRpcImpl(this.accountManager, this.accountStorage);
      return impl.get_account_info(pubkey);
    }
  );

  private getBlock = createMethodHandler(
    async (params: { slot: number }) => {
      const { slot } = params;
      const impl = new GetBlockRpcImpl(this.blockManager);
      return await impl.get_block(slot);
    }
  );

  private getTransaction = createMethodHandler(
    async (params: { signature: string }) => {
      const { signature } = params;
      const impl = new GetTransactionRpcImpl(this.transactionManager);
      return await impl.get_transaction(signature);
    }
  );
}
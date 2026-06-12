use crate::claw_generated::AccountManager;
use crate::claw_generated::AccountStorage;
use jsonrpc_core::{Error, Result};
use jsonrpc_derive::rpc;

#[rpc]
pub trait GetAccountInfoRpc {
    #[rpc(name = "getAccountInfo")]
    fn get_account_info(&self, pubkey: String) -> Result<AccountInfo>;
}

pub struct GetAccountInfoRpcImpl {
    account_manager: AccountManager,
    account_storage: AccountStorage,
}

impl GetAccountInfoRpcImpl {
    pub fn new(account_manager: AccountManager, account_storage: AccountStorage) -> Self {
        GetAccountInfoRpcImpl {
            account_manager,
            account_storage,
        }
    }
}

impl GetAccountInfoRpc for GetAccountInfoRpcImpl {
    fn get_account_info(&self, pubkey: String) -> Result<AccountInfo> {
        let account = self.account_storage.get_account(&pubkey)?;
        let lamports = self.account_manager.get_balance(&pubkey)?;
        let owner = account.owner.to_string();
        let executable = account.executable;

        Ok(AccountInfo {
            lamports,
            owner,
            executable,
        })
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AccountInfo {
    pub lamports: u64,
    pub owner: String,
    pub executable: bool,
}
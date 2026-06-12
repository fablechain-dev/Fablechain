use crate::blockchain::AccountManager;
use crate::rpc::RpcContext;
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
pub struct GetBalanceParams {
    pub pubkey: String,
}

#[derive(Serialize)]
pub struct GetBalanceResult {
    pub lamports: u64,
}

pub async fn get_balance(ctx: &RpcContext, params: GetBalanceParams) -> Result<GetBalanceResult, String> {
    let account_manager = ctx.account_manager.clone();
    let pubkey = params.pubkey.parse().map_err(|e| format!("Invalid public key: {}", e))?;

    let balance = account_manager.get_balance(&pubkey).await.map_err(|e| format!("Error getting balance: {}", e))?;
    Ok(GetBalanceResult { lamports: balance })
}
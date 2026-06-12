use crate::rpc::rpc_methods;
use jsonrpc_core::{IoHandler, Params};
use jsonrpc_derive::rpc;

#[rpc]
pub trait RpcApi {
    #[rpc(name = "simulateTransaction")]
    fn simulate_transaction(&self, params: Params) -&gt; Result&lt;rpc_methods::TransactionSimulationResult, jsonrpc_core::Error&gt;;
}

pub struct RpcServer;

impl RpcApi for RpcServer {
    fn simulate_transaction(&self, params: Params) -&gt; Result&lt;rpc_methods::TransactionSimulationResult, jsonrpc_core::Error&gt; {
        let transaction: Transaction = params.parse()?;
        rpc_methods::simulateTransaction(transaction)
            .map_err(|err| jsonrpc_core::Error::new(jsonrpc_core::ErrorCode::InternalError, err.to_string()))
    }
}

pub fn start_rpc_server() -&gt; IoHandler {
    let mut io = IoHandler::new();
    io.extend_with(RpcServer.to_delegate());
    io
}
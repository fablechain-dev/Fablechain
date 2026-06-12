use crate::state::*;
use crate::transaction::*;

pub mod rpc;

pub fn handle_rpc(request: &RpcRequest) -> Result<RpcResponse, RpcError> {
    match request {
        RpcRequest::SimulateTransaction(tx) => rpc::simulate_transaction(tx),
        // Add other RPC methods here
    }
}
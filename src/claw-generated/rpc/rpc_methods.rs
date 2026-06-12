use crate::rpc::get_balance::{get_balance, GetBalanceParams, GetBalanceResult};

pub fn register_rpc_methods(rpc_server: &mut crate::rpc::RpcServer) {
    rpc_server.register_method("getBalance", get_balance);
}
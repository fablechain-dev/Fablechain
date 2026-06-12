use crate::transaction::TransactionPool;
use crate::rpc::RPCMethods;

pub struct RPCServer {
    rpc_methods: RPCMethods,
}

impl RPCServer {
    pub fn new(transaction_pool: TransactionPool) -> Self {
        let rpc_methods = RPCMethods::new(transaction_pool);
        RPCServer { rpc_methods }
    }

    pub async fn handle_rpc_request(&self, method: &str, params: &[serde_json::Value]) -> serde_json::Value {
        match method {
            "sendTransaction" => self.rpc_methods.send_transaction(params[0].as_str().unwrap().to_string()),
            _ => serde_json::json!({"error": "Method not found"}),
        }
    }
}
use crate::rpc_methods;
use jsonrpc_core::{IoHandler, Params};
use jsonrpc_core::types::error::{ErrorCode, Error};

pub fn start_rpc_server() {
    let mut io = IoHandler::default();

    io.add_method("simulateTransaction", |params: Params| {
        let tx: String = params.parse()?;
        match rpc_methods::simulate_transaction(&tx) {
            Ok((logs, compute_units)) => {
                Ok(json!({
                    "logs": logs,
                    "computeUnits": compute_units
                }))
            }
            Err(e) => {
                Err(Error {
                    code: ErrorCode::InternalError,
                    message: e,
                    data: None,
                })
            }
        }
    });

    // Start RPC server and listen for requests
}
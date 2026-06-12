use serde::{Deserialize, Serialize};
use serde_json::Value;
use crate::claw_generated::transaction::transaction::validate_and_broadcast_transaction;

#[derive(Deserialize)]
struct SendTransactionParams {
    transaction: String,
}

#[derive(Serialize)]
struct SendTransactionResponse {
    transaction_hash: String,
}

pub fn handle_send_transaction(request: &JsonRpcRequest) -> String {
    let params: SendTransactionParams = serde_json::from_value(request.params.clone())
        .expect("Error parsing sendTransaction params");

    // Validate and broadcast the transaction
    let transaction_hash = validate_and_broadcast_transaction(&params.transaction)
        .expect("Error validating and broadcasting transaction");

    let response = SendTransactionResponse {
        transaction_hash,
    };

    serde_json::to_string(&response)
        .expect("Error serializing sendTransaction response")
}
use super::*;
use serde_json;

#[test]
fn test_handle_send_transaction() {
    let request = JsonRpcRequest {
        jsonrpc: "2.0".to_string(),
        id: 1,
        method: "sendTransaction".to_string(),
        params: serde_json::json!({
            "transaction": "ABCD1234=="
        }),
    };

    let response = handle_send_transaction(&request);
    let response: SendTransactionResponse = serde_json::from_str(&response)
        .expect("Error deserializing sendTransaction response");

    assert_eq!(response.transaction_hash, "TODO");
}
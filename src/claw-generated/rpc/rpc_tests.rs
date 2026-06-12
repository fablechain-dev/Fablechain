use super::*;

#[tokio::test]
async fn test_send_transaction() {
    let tx_bytes = "AQAAAAIAAAAAAAAAAAAAAABcdXN0b21Db250cmFjdA==";
    let result = send_transaction(tx_bytes.to_string()).await;
    assert!(result.is_ok());
    let tx_hash = result.unwrap();
    assert!(!tx_hash.is_empty());
}
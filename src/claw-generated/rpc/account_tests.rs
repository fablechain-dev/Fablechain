// src/claw-generated/rpc/account_tests.rs
use super::get_signatures_for_address;

#[tokio::test]
async fn test_get_signatures_for_address() {
    let signatures = get_signatures_for_address("my_address", None, None).await;
    assert!(signatures.len() > 0);
}
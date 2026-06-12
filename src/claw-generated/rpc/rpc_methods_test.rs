use super::*;
use crate::transaction::Transaction;

#[test]
fn test_simulate_transaction() {
    let transaction_json = r#"{
        "instructions": [
            {
                "programId": "11111111111111111111111111111111",
                "accounts": ["22222222222222222222222222222222"],
                "data": "aabbcc"
            }
        ]
    }"#;

    let transaction: Transaction = serde_json::from_str(transaction_json).unwrap();
    let result = simulate_transaction(transaction_json);
    let expected = format!("{{ \"logs\": {:?}, \"compute_units\": {} }}", vec![], 42);
    assert_eq!(result, expected);
}
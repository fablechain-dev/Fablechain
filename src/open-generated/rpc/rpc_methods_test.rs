use crate::rpc_methods;

#[test]
fn test_simulate_transaction() {
    let tx = "AQIDBAUGBwgJCgsMDQ4PEA==";
    let (logs, compute_units) = rpc_methods::simulate_transaction(tx).unwrap();
    assert!(!logs.is_empty());
    assert!(compute_units > 0);
}
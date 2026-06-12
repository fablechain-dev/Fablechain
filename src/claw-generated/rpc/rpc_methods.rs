use crate::transaction::Transaction;

pub fn simulate_transaction(request: &str) -> String {
    // Implement the simulateTransaction RPC method
    let transaction: Transaction = serde_json::from_str(request).unwrap();
    let (logs, compute_units) = transaction.simulate();
    format!("{{ \"logs\": {:?}, \"compute_units\": {} }}", logs, compute_units)
}
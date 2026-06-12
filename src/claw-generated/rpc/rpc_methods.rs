use crate::transaction::TransactionProcessor;

pub fn simulate_transaction(tx: &str) -> Result<(Vec<String>, u64), String> {
    let tx_bytes = base64::decode(tx).map_err(|e| format!("Failed to decode transaction: {}", e))?;
    let mut tx_processor = TransactionProcessor::new();
    let (logs, compute_units) = tx_processor.simulate_transaction(&tx_bytes)?;
    Ok((logs, compute_units))
}
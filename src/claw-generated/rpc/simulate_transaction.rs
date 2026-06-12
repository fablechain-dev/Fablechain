use super::*;
use crate::transaction::Transaction;
use crate::vm::VirtualMachine;

pub async fn simulate_transaction(
    tx_bytes: String,
) -> Result<SimulateTransactionResult, String> {
    let tx = Transaction::from_base64(&tx_bytes)?;
    tx.verify_signatures()?;

    let mut vm = VirtualMachine::new();
    let (logs, compute_units) = vm.execute_transaction(&tx)?;

    Ok(SimulateTransactionResult {
        logs,
        compute_units,
    })
}

#[derive(Serialize)]
pub struct SimulateTransactionResult {
    pub logs: Vec<String>,
    pub compute_units: u64,
}
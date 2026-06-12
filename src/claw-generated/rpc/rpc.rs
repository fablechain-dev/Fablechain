use crate::state::*;
use crate::transaction::*;

pub fn simulate_transaction(tx: &Transaction) -> Result<SimulationResult, RpcError> {
    // 1. Deserialize the transaction
    let tx = Transaction::deserialize(tx.data.as_slice())?;

    // 2. Simulate executing the transaction
    let (logs, compute_units) = tx.simulate(&state)?;

    // 3. Return the simulation result
    Ok(SimulationResult {
        logs,
        compute_units,
    })
}

pub struct SimulationResult {
    pub logs: Vec<String>,
    pub compute_units: u64,
}

#[derive(thiserror::Error, Debug)]
pub enum RpcError {
    #[error("Transaction deserialization error: {0}")]
    DeserializationError(#[from] TransactionDeserializationError),
    #[error("Simulation error: {0}")]
    SimulationError(#[from] SimulationError),
}
use crate::state::*;
use crate::transaction::*;

pub async fn simulateTransaction(
    transaction: Transaction,
) -> Result&lt;TransactionSimulationResult, RpcError&gt; {
    let mut account_state = AccountState::default();
    let result = simulate_transaction(&transaction, &mut account_state)?;
    Ok(TransactionSimulationResult {
        logs: result.logs,
        compute_units: result.compute_units,
    })
}

pub struct TransactionSimulationResult {
    pub logs: Vec&lt;String&gt;,
    pub compute_units: u64,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_simulate_transaction() {
        let transaction = Transaction::default();
        let result = simulateTransaction(transaction).unwrap();
        assert!(!result.logs.is_empty());
        assert_ne!(result.compute_units, 0);
    }
}
use super::*;
use crate::state::State;
use crate::transaction::Transaction;

#[test]
fn test_simulate_transaction() {
    let state = State::default();
    let tx = Transaction::default();

    let result = simulate_transaction(&tx).unwrap();
    assert!(result.logs.len() > 0);
    assert!(result.compute_units > 0);
}
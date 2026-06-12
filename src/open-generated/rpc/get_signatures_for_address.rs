use crate::state::transaction::Transaction;
use crate::state::account::Account;

pub async fn get_signatures_for_address(
    account: &Account,
    start_slot: Option<u64>,
    limit: Option<u64>,
) -> Result<Vec<String>, anyhow::Error> {
    // Fetch the transaction signatures for the given account
    let signatures = account.get_transaction_signatures(start_slot, limit)?;

    Ok(signatures)
}
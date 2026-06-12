// src/claw-generated/rpc/account.rs
use crate::state::Account;

pub async fn get_signatures_for_address(
    address: &str,
    start: Option<u64>,
    limit: Option<u64>,
) -> Vec<String> {
    let account = Account::get_by_address(address);
    let signatures = account.get_signatures(start, limit);
    signatures
}
// src/claw-generated/rpc/mod.rs
mod account;
mod block;
mod transaction;

pub async fn get_signatures_for_address(
    address: &str,
    start: Option<u64>,
    limit: Option<u64>,
) -> Vec<String> {
    account::get_signatures_for_address(address, start, limit).await
}
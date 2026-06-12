use solana_sdk::{pubkey::Pubkey, signature::Signature};
use std::collections::HashSet;

#[derive(Default, Debug)]
pub struct AccountState {
    pub owner: Pubkey,
    pub lamports: u64,
    pub data: Vec<u8>,
    pub executable: bool,
    pub rent_epoch: u64,
    pub transaction_signatures: HashSet&lt;Signature&gt;,
}

impl AccountState {
    pub fn new(
        owner: Pubkey,
        lamports: u64,
        data: Vec&lt;u8&gt;,
        executable: bool,
        rent_epoch: u64,
    ) -> Self {
        Self {
            owner,
            lamports,
            data,
            executable,
            rent_epoch,
            transaction_signatures: HashSet::new(),
        }
    }

    pub fn add_transaction_signature(&mut self, signature: Signature) {
        self.transaction_signatures.insert(signature);
    }
}
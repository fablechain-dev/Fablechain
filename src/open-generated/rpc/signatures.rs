use crate::state::Account;
use crate::transaction::Transaction;
use std::collections::HashSet;

pub struct SignaturesForAddressParams {
    pub address: String,
    pub limit: usize,
    pub before: Option<String>,
    pub until: Option<String>,
}

pub struct SignaturesForAddressResult {
    pub signatures: Vec<String>,
    pub before: Option<String>,
    pub until: Option<String>,
}

pub fn get_signatures_for_address(params: SignaturesForAddressParams) -> SignaturesForAddressResult {
    let transactions: Vec<Transaction> = Account::get_transactions_for_address(&params.address);
    let mut signatures: HashSet<String> = transactions.iter()
        .map(|tx| tx.signature.clone())
        .collect();

    let mut signature_vec: Vec<String> = signatures.into_iter().collect();
    signature_vec.sort_by(|a, b| {
        // Sort in descending order by block height
        let tx_a = Transaction::get_by_signature(a).unwrap();
        let tx_b = Transaction::get_by_signature(b).unwrap();
        tx_b.block_height.cmp(&tx_a.block_height)
    });

    let start = if let Some(before) = params.before {
        signature_vec.iter().position(|sig| sig == &before).unwrap_or(0) + 1
    } else {
        0
    };

    let end = if let Some(until) = params.until {
        signature_vec.iter().position(|sig| sig == &until).unwrap_or(signature_vec.len())
    } else {
        std::cmp::min(start + params.limit, signature_vec.len())
    };

    let result_signatures = signature_vec[start..end].to_vec();
    let before = result_signatures.first().cloned();
    let until = result_signatures.last().cloned();

    SignaturesForAddressResult {
        signatures: result_signatures,
        before,
        until,
    }
}
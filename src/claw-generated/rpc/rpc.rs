use super::*;
use crate::transaction::Transaction;

pub async fn send_transaction(
    tx_bytes: String,
) -> Result<String, String> {
    let tx = Transaction::from_base64(&tx_bytes)?;
    tx.verify_signatures()?;
    tx.broadcast().await?;
    Ok(tx.hash().to_string())
}

pub async fn get_transaction(
    signature: String,
) -> Result<Option<Transaction>, String> {
    let tx = Transaction::from_signature(&signature)?;
    if let Some(tx) = tx {
        Ok(Some(tx))
    } else {
        Ok(None)
    }
}
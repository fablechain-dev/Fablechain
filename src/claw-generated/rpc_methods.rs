use crate::transaction::TransactionPool;
use crate::transaction::Transaction;

pub struct RPCMethods {
    transaction_pool: TransactionPool,
}

impl RPCMethods {
    pub fn new(transaction_pool: TransactionPool) -> Self {
        RPCMethods { transaction_pool }
    }

    pub async fn send_transaction(&self, signed_tx: String) -> Result<(), String> {
        // 1. Decode the base64-encoded signed transaction
        let tx_bytes = base64::decode(&signed_tx)
            .map_err(|e| format!("Error decoding transaction: {}", e))?;

        // 2. Deserialize the Transaction from the bytes
        let tx = Transaction::from_bytes(&tx_bytes)
            .map_err(|e| format!("Error deserializing transaction: {}", e))?;

        // 3. Validate the transaction
        if !tx.is_valid() {
            return Err("Transaction is not valid".to_string());
        }

        // 4. Add the transaction to the pool
        self.transaction_pool.add_transaction(tx);

        // 5. Broadcast the transaction to the network
        // TODO: Implement network broadcast

        Ok(())
    }
}
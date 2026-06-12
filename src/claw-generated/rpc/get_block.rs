use std::sync::Arc;

use crate::blockchain::BlockManager;
use crate::rpc::models::{BlockResponse, TransactionDetails};

pub struct GetBlockRpcImpl {
    block_manager: Arc<BlockManager>,
}

impl GetBlockRpcImpl {
    pub fn new(block_manager: Arc<BlockManager>) -> Self {
        GetBlockRpcImpl { block_manager }
    }

    pub async fn get_block(&self, slot: u64) -> Result<BlockResponse, String> {
        let block = self.block_manager.get_block_by_slot(slot).await?;

        let transactions = block.transactions.iter().map(|tx| TransactionDetails {
            signature: tx.signature.to_string(),
            // Add other transaction details here
        }).collect();

        Ok(BlockResponse {
            slot: block.slot,
            timestamp: block.timestamp,
            transactions,
            // Add other block details here
        })
    }
}
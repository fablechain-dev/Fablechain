use crate::state::BlockStore;

pub struct BlockRpcHandler {
    block_store: BlockStore,
}

impl BlockRpcHandler {
    pub fn new(block_store: BlockStore) -> Self {
        BlockRpcHandler { block_store }
    }

    pub async fn get_block(&self, slot: u64) -> Result&lt;Block, RpcError&gt; {
        let block = self.block_store.get_block(slot).await.map_err(|err| {
            match err {
                BlockStoreError::BlockNotFound(slot) => RpcError::BlockNotFound(slot),
                BlockStoreError::InternalError(msg) => RpcError::InternalError(msg),
            }
        })?;
        Ok(block)
    }
}

#[derive(Debug, thiserror::Error)]
pub enum RpcError {
    #[error("Block not found for slot {0}")]
    BlockNotFound(u64),
    #[error("Internal error: {0}")]
    InternalError(String),
}
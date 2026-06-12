use std::sync::Arc;

use crate::block::Block;
use crate::state::State;

pub fn handle(state: Arc<State>, params: &[serde_json::Value]) -> Result<serde_json::Value, String> {
    // TODO: Implement getBlock RPC method
    Ok(serde_json::json!({
        "slot": 123,
        "transactions": [
            {
                "signature": "abc123",
                "accounts": ["user1", "contract1"],
                "instructions": [
                    {
                        "programId": "contract1",
                        "accounts": ["user1", "contract1"],
                        "data": "0x1234"
                    }
                ]
            }
        ]
    }))
}
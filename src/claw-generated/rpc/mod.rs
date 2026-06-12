use std::collections::HashMap;

pub async fn get_account_info(pubkey: &str) -> Result<AccountInfo, String> {
    // Look up account data in storage
    let account_data = get_account_data(pubkey)?;

    // Extract relevant fields
    let lamports = account_data.lamports;
    let owner = account_data.owner;
    let executable = account_data.executable;

    Ok(AccountInfo {
        lamports,
        owner,
        executable,
    })
}

struct AccountInfo {
    pub lamports: u64,
    pub owner: Vec<u8>,
    pub executable: bool,
}
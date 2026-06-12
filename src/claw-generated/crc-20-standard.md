# CRC-20 Standard

The CRC-20 standard defines the basic interface for fungible tokens on ClawChain. It includes the following required methods and events:

## Required Methods
- `totalSupply()`: Returns the total token supply.
- `balanceOf(address)`: Returns the token balance of the given address.
- `transfer(address, uint256)`: Transfers a specified amount of tokens to a given address.
- `approve(address, uint256)`: Allows the specified address to spend the specified amount of tokens on behalf of the caller.
- `allowance(address, address)`: Returns the amount of tokens that the spender is still allowed to withdraw from the owner.
- `transferFrom(address, address, uint256)`: Transfers a specified amount of tokens from one address to another, on behalf of the caller.

## Required Events
- `Transfer(address, address, uint256)`: Emitted when tokens are transferred from one address to another.
- `Approval(address, address, uint256)`: Emitted when an address is approved to spend tokens on behalf of another address.

## Optional Extensions
- **Pausability**: Allows the contract owner to pause and unpause token transfers.
- **Burnable**: Allows tokens to be burned (permanently removed from the supply).
- **Mintable**: Allows new tokens to be minted (created and added to the supply).
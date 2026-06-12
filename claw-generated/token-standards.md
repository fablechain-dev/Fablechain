# ClawChain Token Standards

## CRC-20 Standard
### Overview
The CRC-20 (ClawChain Request for Comments 20) standard defines a common interface for fungible tokens on the ClawChain blockchain. It provides a set of methods and events that allow for the basic functionality of a token, such as transferring tokens, checking balances, and approving third-party spending.

### Required Methods
- `name()`: Returns the name of the token.
- `symbol()`: Returns the symbol of the token.
- `decimals()`: Returns the number of decimal places the token uses.
- `totalSupply()`: Returns the total token supply.
- `balanceOf(address)`: Returns the account balance of the owner's address.
- `transfer(address, amount)`: Transfers a specified amount of tokens to a given address.
- `approve(address, amount)`: Allows a spender to withdraw a set amount of tokens from a given address.
- `allowance(address, address)`: Returns the amount of tokens a spender is still allowed to withdraw from an owner.

### Optional Methods
- `increaseAllowance(address, amount)`: Increases the allowance of a spender by a given amount.
- `decreaseAllowance(address, amount)`: Decreases the allowance of a spender by a given amount.

### Events
- `Transfer(address, address, amount)`: Emitted when tokens are transferred.
- `Approval(address, address, amount)`: Emitted when an approval is set.

### Security Considerations
- Carefully implement the `transfer` and `approve` functions to prevent common vulnerabilities like the "Approve then Transfer" attack.
- Validate all user inputs to prevent integer overflow/underflow issues.
- Ensure that the `decimals` value is consistent across the token implementation.

### Examples
See the [CRC-20 sample implementation](https://github.com/ClawChain/contracts/blob/main/contracts/CRC20.sol) for a reference implementation.

## CRC-721 Standard
### Overview
The CRC-721 (ClawChain Request for Comments 721) standard defines a non-fungible token (NFT) interface on the ClawChain blockchain. It provides a set of methods and events that allow for the creation, ownership, and transfer of unique digital assets.

### Required Methods
- `name()`: Returns the name of the NFT collection.
- `symbol()`: Returns the symbol of the NFT collection.
- `totalSupply()`: Returns the total number of NFTs in the collection.
- `balanceOf(address)`: Returns the number of NFTs owned by a given address.
- `ownerOf(tokenId)`: Returns the owner of a specific NFT.
- `safeTransferFrom(address, address, tokenId)`: Transfers an NFT from one address to another, ensuring the recipient can accept the token.
- `transferFrom(address, address, tokenId)`: Transfers an NFT from one address to another without any safety checks.
- `approve(address, tokenId)`: Grants an address the ability to transfer a specific NFT.
- `getApproved(tokenId)`: Returns the address that is approved to transfer a specific NFT.
- `setApprovalForAll(address, bool)`: Grants or revokes an address the ability to transfer any of the caller's NFTs.
- `isApprovedForAll(address, address)`: Returns whether an address is approved to transfer any of the owner's NFTs.

### Events
- `Transfer(address, address, tokenId)`: Emitted when an NFT is transferred.
- `Approval(address, address, tokenId)`: Emitted when an approval is set for a specific NFT.
- `ApprovalForAll(address, address, bool)`: Emitted when an operator is enabled or disabled for an owner.

### Metadata Extensions
The CRC-721 standard also includes optional metadata extensions that allow for the storage and retrieval of additional information about each NFT, such as its name, description, and associated image.

### Security Considerations
- Carefully implement the `safeTransferFrom` and `transferFrom` functions to prevent unauthorized transfers.
- Validate all user inputs to prevent potential vulnerabilities.
- Ensure that the NFT metadata is properly stored and accessible.

### Examples
See the [CRC-721 sample implementation](https://github.com/ClawChain/contracts/blob/main/contracts/CRC721.sol) for a reference implementation.
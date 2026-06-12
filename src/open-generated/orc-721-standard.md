# ORC-721 Standard

The ORC-721 standard defines the basic interface for non-fungible tokens on OpenChain. It includes the following required methods and events:

## Required Methods
- `balanceOf(address)`: Returns the number of NFTs owned by the given address.
- `ownerOf(uint256)`: Returns the owner of the NFT with the given ID.
- `safeTransferFrom(address, address, uint256)`: Safely transfers an NFT from one address to another.
- `transferFrom(address, address, uint256)`: Transfers an NFT from one address to another.
- `approve(address, uint256)`: Allows the specified address to transfer the NFT with the given ID.
- `setApprovalForAll(address, bool)`: Allows or disallows the specified address to transfer all of the caller's NFTs.
- `getApproved(uint256)`: Returns the address that is approved to transfer the NFT with the given ID.
- `isApprovedForAll(address, address)`: Returns whether the specified address is approved to transfer all of the caller's NFTs.

## Required Events
- `Transfer(address, address, uint256)`: Emitted when an NFT is transferred from one address to another.
- `Approval(address, address, uint256)`: Emitted when an address is approved to transfer a specific NFT.
- `ApprovalForAll(address, address, bool)`: Emitted when an address is approved (or disapproved) to transfer all of the caller's NFTs.

## Optional Extensions
- **Enumerable**: Allows iteration over all NFTs in the contract.
- **Metadata**: Allows the retrieval of metadata for a given NFT.
- **Royalties**: Allows the contract to receive royalties when an NFT is sold.
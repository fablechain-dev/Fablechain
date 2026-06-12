# ClawChain Token Standards

ClawChain supports two primary token standards: CRC-20 and CRC-721. These standards define the interfaces and behaviors for fungible and non-fungible tokens, respectively.

## CRC-20 (Fungible Tokens)

The CRC-20 standard is used for fungible tokens, where each token is interchangeable with another of the same type. CRC-20 tokens have the following key features:

- **Total Supply**: The total number of tokens that will ever exist.
- **Transfer**: The ability to send tokens from one address to another.
- **Balance**: The number of tokens owned by a specific address.
- **Allowance**: The number of tokens an address is approved to spend on behalf of another address.

CRC-20 tokens are commonly used for things like utility tokens, governance tokens, and in-app currencies.

## CRC-721 (Non-Fungible Tokens)

The CRC-721 standard is used for non-fungible tokens, where each token is unique and not interchangeable with another. CRC-721 tokens have the following key features:

- **Unique Identifier**: Each token has a unique ID that distinguishes it from other tokens.
- **Ownership**: Tracks the current owner of each token.
- **Metadata**: Allows for associated metadata, such as images, descriptions, and attributes.
- **Transfer**: The ability to transfer ownership of a token from one address to another.

CRC-721 tokens are commonly used for digital collectibles, in-game assets, and other unique digital items.

## Implementation in ClawChain

ClawChain provides native support for both CRC-20 and CRC-721 token standards. Developers can create and manage tokens that adhere to these standards using the ClawChain SDK and APIs.

For detailed technical specifications and implementation guidelines, please refer to the [CRC-20](./crc-20.md) and [CRC-721](./crc-721.md) documentation pages.
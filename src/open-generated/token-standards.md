# OpenChain Token Standards

OpenChain supports two primary token standards: ORC-20 and ORC-721. These standards define the interfaces and behaviors for fungible and non-fungible tokens, respectively.

## ORC-20 (Fungible Tokens)

The ORC-20 standard is used for fungible tokens, where each token is interchangeable with another of the same type. ORC-20 tokens have the following key features:

- **Total Supply**: The total number of tokens that will ever exist.
- **Transfer**: The ability to send tokens from one address to another.
- **Balance**: The number of tokens owned by a specific address.
- **Allowance**: The number of tokens an address is approved to spend on behalf of another address.

ORC-20 tokens are commonly used for things like utility tokens, governance tokens, and in-app currencies.

## ORC-721 (Non-Fungible Tokens)

The ORC-721 standard is used for non-fungible tokens, where each token is unique and not interchangeable with another. ORC-721 tokens have the following key features:

- **Unique Identifier**: Each token has a unique ID that distinguishes it from other tokens.
- **Ownership**: Tracks the current owner of each token.
- **Metadata**: Allows for associated metadata, such as images, descriptions, and attributes.
- **Transfer**: The ability to transfer ownership of a token from one address to another.

ORC-721 tokens are commonly used for digital collectibles, in-game assets, and other unique digital items.

## Implementation in OpenChain

OpenChain provides native support for both ORC-20 and ORC-721 token standards. Developers can create and manage tokens that adhere to these standards using the OpenChain SDK and APIs.

For detailed technical specifications and implementation guidelines, please refer to the [ORC-20](./orc-20.md) and [ORC-721](./orc-721.md) documentation pages.
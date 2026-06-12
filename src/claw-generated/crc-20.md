# CRC-20 Token Standard

The CRC-20 token standard defines the common set of rules and behaviors for fungible tokens on the ClawChain platform. This ensures consistency and interoperability between different CRC-20 token implementations.

## Key Features

**Total Supply**: The total number of tokens that will ever exist. This is a fixed value that cannot be changed.

**Transfer**: The ability to send tokens from one address to another. Transfers can be initiated by the token owner or by a third-party with approval (allowance).

**Balance**: The number of tokens owned by a specific address. Balances can be queried and updated through token transfers.

**Allowance**: The number of tokens an address is approved to spend on behalf of another address. This allows for third-party spending of tokens.

## CRC-20 Interface

The CRC-20 interface defines the required methods and events for a CRC-20 token contract:

```solidity
interface ICRC20 {
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}
```

## Implementation in ClawChain

ClawChain provides a base CRC-20 token contract that developers can extend and customize for their specific use cases. The base contract includes the required functionality and events, as well as optional features like pausability, burnable, and mintable.

Developers can create new CRC-20 tokens by deploying the base contract and configuring the initial parameters, such as name, symbol, and total supply. The ClawChain SDK and APIs provide a straightforward interface for interacting with CRC-20 tokens.
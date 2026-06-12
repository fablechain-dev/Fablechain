# ClawChain Token Standards

ClawChain supports two main token standards: CRC-20 and CRC-721. This document outlines the key features and requirements of each standard.

## CRC-20 (Fungible Tokens)
CRC-20 is the standard for fungible tokens on the ClawChain network. Fungible tokens are interchangeable and divisible, meaning one token is equivalent to any other token of the same type.

### Key Features
- **Total Supply**: CRC-20 tokens have a fixed total supply that is set at the time of deployment.
- **Transfers**: Tokens can be transferred between accounts. The `transfer()` function allows users to send tokens to other addresses.
- **Balances**: Each account has a balance of the token, which can be queried using the `balanceOf()` function.
- **Approvals**: Accounts can approve other addresses to spend a certain amount of their tokens using the `approve()` function.

### Example Implementation
Here's a basic example of a CRC-20 token contract in Solidity:

```solidity
pragma solidity ^0.8.0;

contract CRC20Token {
    string public name;
    string public symbol;
    uint8 public decimals;
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor(string memory _name, string memory _symbol, uint8 _decimals, uint256 _totalSupply) {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
        totalSupply = _totalSupply * 10 ** uint256(decimals);
        balanceOf[msg.sender] = totalSupply;
    }

    function transfer(address _to, uint256 _value) public returns (bool success) {
        require(balanceOf[msg.sender] >= _value, "Insufficient balance");
        balanceOf[msg.sender] -= _value;
        balanceOf[_to] += _value;
        emit Transfer(msg.sender, _to, _value);
        return true;
    }

    function approve(address _spender, uint256 _value) public returns (bool success) {
        allowance[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }

    // Additional functions like transferFrom(), increaseAllowance(), decreaseAllowance()
}
```

## CRC-721 (Non-Fungible Tokens)
CRC-721 is the standard for non-fungible tokens (NFTs) on the ClawChain network. NFTs are unique, indivisible tokens that represent ownership of digital or physical assets.

### Key Features
- **Unique Identifiers**: Each CRC-721 token has a unique identifier (tokenId) that distinguishes it from other tokens.
- **Ownership**: The owner of a CRC-721 token is tracked using the `ownerOf()` function.
- **Transfers**: Tokens can be transferred between accounts using the `transferFrom()` function.
- **Approvals**: Accounts can approve other addresses to transfer a specific token using the `approve()` and `setApprovalForAll()` functions.
- **Metadata**: CRC-721 tokens can have associated metadata, such as a URI pointing to the token's image or other data.

### Example Implementation
Here's a basic example of a CRC-721 token contract in Solidity:

```solidity
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract CRC721Token is ERC721 {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    constructor(string memory name, string memory symbol) ERC721(name, symbol) {}

    function safeMint(address to) public {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(_exists(tokenId), "CRC721Token: URI query for nonexistent token");
        return string(abi.encodePacked("https://example.com/tokens/", Strings.toString(tokenId)));
    }
}
```

This is a basic implementation that follows the OpenZeppelin ERC721 contract. It includes functions for minting new tokens, querying the token URI, and transferring tokens between owners.

I'll continue to build out the documentation, providing more details and examples for each standard. Please let me know if you have any other requirements or feedback.
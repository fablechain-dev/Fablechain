// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract ORC721 is ERC721 {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    struct TokenMetadata {
        string name;
        string description;
        string imageUri;
    }

    mapping(uint256 => TokenMetadata) private _tokenMetadata;

    constructor(string memory name, string memory symbol) ERC721(name, symbol) {}

    function mint(address to, string memory name, string memory description, string memory imageUri) public {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);
        _tokenMetadata[tokenId] = TokenMetadata(name, description, imageUri);
    }

    function burn(uint256 tokenId) public {
        require(_exists(tokenId), "ORC721: token does not exist");
        require(ownerOf(tokenId) == msg.sender, "ORC721: caller is not owner");
        _burn(tokenId);
        delete _tokenMetadata[tokenId];
    }

    function transferFrom(address from, address to, uint256 tokenId) public virtual override {
        require(_isApprovedOrOwner(_msgSender(), tokenId), "ORC721: caller is not owner nor approved");
        _transfer(from, to, tokenId);
    }

    function getTokenMetadata(uint256 tokenId) public view returns (TokenMetadata memory) {
        require(_exists(tokenId), "ORC721: token does not exist");
        return _tokenMetadata[tokenId];
    }
}
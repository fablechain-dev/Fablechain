// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CRCNFT is ERC721, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    mapping(uint256 => string) private _tokenURIs;

    constructor(string memory name, string memory symbol) ERC721(name, symbol) {}

    function safeMint(address to) public onlyOwner {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);
    }

    function setTokenURI(uint256 tokenId, string memory tokenURI) public onlyOwner {
        _tokenURIs[tokenId] = tokenURI;
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(_exists(tokenId), "CRC721: URI query for nonexistent token");
        return _tokenURIs[tokenId];
    }

    function transferFrom(address from, address to, uint256 tokenId) public virtual override {
        require(_isApprovedOrOwner(_msgSender(), tokenId), "CRC721: transfer caller is not owner nor approved");
        _transfer(from, to, tokenId);
    }

    function approve(address to, uint256 tokenId) public virtual override {
        address owner = ownerOf(tokenId);
        require(to != owner, "CRC721: approval to current owner");
        require(_msgSender() == owner || isApprovedForAll(owner, _msgSender()), "CRC721: approve caller is not owner nor approved for all");
        _approve(to, tokenId);
    }

    function getOwnedTokens(address owner) public view returns (uint256[] memory) {
        uint256 tokenCount = balanceOf(owner);
        uint256[] memory result = new uint256[](tokenCount);
        uint256 index = 0;

        for (uint256 i = 0; i < _tokenIdCounter.current(); i++) {
            if (ownerOf(i) == owner) {
                result[index++] = i;
            }
        }

        return result;
    }

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);
}
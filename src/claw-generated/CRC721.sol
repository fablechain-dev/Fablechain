// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./ERC165.sol";

/**
 * @dev Implementation of the CRC-721 Non-Fungible Token Standard.
 */
contract CRC721 is ERC165 {
    // Token name
    string public name;

    // Token symbol
    string public symbol;

    // Mapping from token ID to owner address
    mapping(uint256 => address) private _owners;

    // Mapping from token ID to approved address
    mapping(uint256 => address) private _tokenApprovals;

    // Mapping from owner to operator approvals
    mapping(address => mapping(address => bool)) private _operatorApprovals;

    // Mapping from token ID to token URI
    mapping(uint256 => string) private _tokenURIs;

    // Total number of tokens
    uint256 private _totalSupply;

    constructor(string memory name_, string memory symbol_) {
        name = name_;
        symbol = symbol_;
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return
            interfaceId == type(IERC721).interfaceId ||
            interfaceId == type(IERC721Metadata).interfaceId ||
            super.supportsInterface(interfaceId);
    }

    /**
     * @dev Mints a new token with the given tokenId.
     * @param to The address that will own the minted token.
     * @param tokenId The ID of the token to mint.
     */
    function mint(address to, uint256 tokenId) public {
        require(_owners[tokenId] == address(0), "Token already exists");
        _owners[tokenId] = to;
        _totalSupply++;
    }

    /**
     * @dev Burns the token with the given tokenId.
     * @param tokenId The ID of the token to burn.
     */
    function burn(uint256 tokenId) public {
        address owner = _owners[tokenId];
        require(owner != address(0), "Token does not exist");
        require(owner == msg.sender || isApprovedForAll(owner, msg.sender), "Not authorized");
        _owners[tokenId] = address(0);
        _totalSupply--;
    }

    /**
     * @dev Transfers the token with the given tokenId from the sender to the recipient.
     * @param from The address that currently owns the token.
     * @param to The address that will receive the token.
     * @param tokenId The ID of the token to transfer.
     */
    function transferFrom(address from, address to, uint256 tokenId) public {
        address owner = _owners[tokenId];
        require(owner != address(0), "Token does not exist");
        require(owner == from, "Not the owner");
        require(to != address(0), "Cannot transfer to the zero address");
        require(
            from == msg.sender || isApprovedForAll(from, msg.sender) || _tokenApprovals[tokenId] == msg.sender,
            "Not authorized"
        );
        _owners[tokenId] = to;
        _tokenApprovals[tokenId] = address(0);
    }

    /**
     * @dev Approves the given address to transfer the specified token on behalf of the caller.
     * @param to The address to be approved for the given token ID.
     * @param tokenId The ID of the token to be approved.
     */
    function approve(address to, uint256 tokenId) public {
        address owner = _owners[tokenId];
        require(owner != address(0), "Token does not exist");
        require(owner == msg.sender || isApprovedForAll(owner, msg.sender), "Not authorized");
        _tokenApprovals[tokenId] = to;
    }

    /**
     * @dev Sets or unsets the approval of a given operator.
     * @param operator The operator address to set the approval.
     * @param approved True if the operation can be approved, false to revoke the approval.
     */
    function setApprovalForAll(address operator, bool approved) public {
        _operatorApprovals[msg.sender][operator] = approved;
    }

    /**
     * @dev Returns whether the given spender is approved to transfer the given token on behalf of the owner.
     * @param owner The address that owns the token.
     * @param operator The address that acts on behalf of the owner.
     * @return bool True if the operator is approved, false otherwise.
     */
    function isApprovedForAll(address owner, address operator) public view returns (bool) {
        return _operatorApprovals[owner][operator];
    }

    /**
     * @dev Returns the total number of tokens in existence.
     * @return uint256 The total number of tokens.
     */
    function totalSupply() public view returns (uint256) {
        return _totalSupply;
    }

    /**
     * @dev Returns the owner of the specified token ID.
     * @param tokenId The ID of the token to query the owner of.
     * @return address The owner of the specified token ID.
     */
    function ownerOf(uint256 tokenId) public view returns (address) {
        address owner = _owners[tokenId];
        require(owner != address(0), "Token does not exist");
        return owner;
    }

    /**
     * @dev Sets the token URI for the specified token ID.
     * @param tokenId The ID of the token.
     * @param tokenURI The URI of the token metadata.
     */
    function setTokenURI(uint256 tokenId, string memory tokenURI) public {
        require(_owners[tokenId] != address(0), "Token does not exist");
        require(_owners[tokenId] == msg.sender || isApprovedForAll(_owners[tokenId], msg.sender), "Not authorized");
        _tokenURIs[tokenId] = tokenURI;
    }

    /**
     * @dev Returns the token URI of the specified token ID.
     * @param tokenId The ID of the token.
     * @return string The token URI.
     */
    function tokenURI(uint256 tokenId) public view returns (string memory) {
        require(_owners[tokenId] != address(0), "Token does not exist");
        return _tokenURIs[tokenId];
    }
}
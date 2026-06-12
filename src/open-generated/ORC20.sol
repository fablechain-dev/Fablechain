// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title ORC-20 Token Standard
 * @dev Fungible token standard for OpenChain
 */
contract ORC20 {
    // Events
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    // Token Metadata
    string public name;
    string public symbol;
    uint8 public decimals;

    // Token State
    mapping(address =&gt; uint256) public balanceOf;
    mapping(address =&gt; mapping(address =&gt; uint256)) public allowance;

    // Constructor
    constructor(string memory _name, string memory _symbol, uint8 _decimals) {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
    }

    // Token Transfer
    function transfer(address _to, uint256 _value) public virtual returns (bool) {
        require(_value &lt;= balanceOf[msg.sender], "Insufficient balance");
        balanceOf[msg.sender] -= _value;
        balanceOf[_to] += _value;
        emit Transfer(msg.sender, _to, _value);
        return true;
    }

    // Token Approval
    function approve(address _spender, uint256 _value) public virtual returns (bool) {
        allowance[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }

    // Token TransferFrom
    function transferFrom(address _from, address _to, uint256 _value) public virtual returns (bool) {
        require(_value &lt;= balanceOf[_from], "Insufficient balance");
        require(_value &lt;= allowance[_from][msg.sender], "Insufficient allowance");
        balanceOf[_from] -= _value;
        balanceOf[_to] += _value;
        allowance[_from][msg.sender] -= _value;
        emit Transfer(_from, _to, _value);
        return true;
    }
}
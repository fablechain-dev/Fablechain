// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./ORCT20.sol";

contract ORCT20Test {
    ORCT20 public token;

    constructor(string memory name, string memory symbol, uint8 decimals) {
        token = new ORCT20(name, symbol, decimals);
    }

    function mint(address account, uint256 amount) public {
        token._mint(account, amount);
    }

    function burn(address account, uint256 amount) public {
        token._burn(account, amount);
    }

    function transfer(address recipient, uint256 amount) public {
        token.transfer(recipient, amount);
    }

    function approve(address spender, uint256 amount) public {
        token.approve(spender, amount);
    }

    function transferFrom(address sender, address recipient, uint256 amount) public {
        token.transferFrom(sender, recipient, amount);
    }

    function increaseAllowance(address spender, uint256 addedValue) public {
        token.increaseAllowance(spender, addedValue);
    }

    function decreaseAllowance(address spender, uint256 subtractedValue) public {
        token.decreaseAllowance(spender, subtractedValue);
    }

    function totalSupply() public view returns (uint256) {
        return token.totalSupply();
    }

    function balanceOf(address account) public view returns (uint256) {
        return token.balanceOf(account);
    }
}
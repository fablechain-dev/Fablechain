pragma solidity ^0.8.0;

import "truffle/Assert.sol";
import "../CRC20Token.sol";

contract CRC20TokenTest {
    CRC20Token token;

    function beforeEach() public {
        token = new CRC20Token("ClawChain Token", "CCT", 18, 1000000);
    }

    function testDeployment() public {
        Assert.equal(token.name(), "ClawChain Token", "Name should be 'ClawChain Token'");
        Assert.equal(token.symbol(), "CCT", "Symbol should be 'CCT'");
        Assert.equal(token.decimals(), 18, "Decimals should be 18");
        Assert.equal(token.totalSupply(), 1000000 * 10 ** 18, "Total supply should be 1,000,000");
        Assert.equal(token.balanceOf(address(this)), 1000000 * 10 ** 18, "Balance should be 1,000,000");
    }

    function testTransfer() public {
        address recipient = 0x1234567890123456789012345678901234567890;
        token.transfer(recipient, 100 * 10 ** 18);
        Assert.equal(token.balanceOf(address(this)), 999900 * 10 ** 18, "Balance should be 999,900");
        Assert.equal(token.balanceOf(recipient), 100 * 10 ** 18, "Recipient balance should be 100");
    }

    function testApprove() public {
        address spender = 0x1234567890123456789012345678901234567890;
        token.approve(spender, 100 * 10 ** 18);
        Assert.equal(token.allowance(address(this), spender), 100 * 10 ** 18, "Allowance should be 100");
    }
}
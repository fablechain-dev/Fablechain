// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "truffle/Assert.sol";
import "./ORC20.sol";

contract ORC20Test {
    ORC20 public orc20;

    function beforeEach() public {
        orc20 = new ORC20("OpenChain Token", "OPEN", 18, 1000000);
    }

    function testTotalSupply() public {
        uint256 expectedSupply = 1000000 * 10 ** 18;
        Assert.equal(orc20.totalSupply(), expectedSupply, "Total supply should be 1,000,000 OPEN");
    }

    function testBalanceOf() public {
        Assert.equal(orc20.balanceOf(address(this)), 1000000 * 10 ** 18, "Balance should be 1,000,000 OPEN");
    }

    function testTransfer() public {
        address recipient = 0x1234567890123456789012345678901234567890;
        uint256 amount = 100 * 10 ** 18;
        Assert.isTrue(orc20.transfer(recipient, amount), "Transfer should succeed");
        Assert.equal(orc20.balanceOf(recipient), amount, "Recipient should have 100 OPEN");
        Assert.equal(orc20.balanceOf(address(this)), (1000000 - 100) * 10 ** 18, "Sender should have 999,900 OPEN");
    }

    function testApproveAndTransferFrom() public {
        address spender = 0x0123456789012345678901234567890123456789;
        uint256 amount = 50 * 10 ** 18;
        Assert.isTrue(orc20.approve(spender, amount), "Approve should succeed");
        Assert.equal(orc20.allowance(address(this), spender), amount, "Allowance should be 50 OPEN");

        ORC20 spenderContract = ORC20(spender);
        Assert.isTrue(spenderContract.transferFrom(address(this), spender, amount), "TransferFrom should succeed");
        Assert.equal(orc20.balanceOf(address(this)), (1000000 - 50) * 10 ** 18, "Sender should have 999,950 OPEN");
        Assert.equal(orc20.balanceOf(spender), amount, "Spender should have 50 OPEN");
    }
}
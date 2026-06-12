// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "truffle/Assert.sol";
import "./CRC20.sol";

contract CRC20Test {
    CRC20 public crc20;

    function beforeEach() public {
        crc20 = new CRC20("ClawChain Token", "CLAW", 18, 1000000);
    }

    function testTotalSupply() public {
        uint256 expectedSupply = 1000000 * 10 ** 18;
        Assert.equal(crc20.totalSupply(), expectedSupply, "Total supply should be 1,000,000 CLAW");
    }

    function testBalanceOf() public {
        Assert.equal(crc20.balanceOf(address(this)), 1000000 * 10 ** 18, "Balance should be 1,000,000 CLAW");
    }

    function testTransfer() public {
        address recipient = 0x1234567890123456789012345678901234567890;
        uint256 amount = 100 * 10 ** 18;
        Assert.isTrue(crc20.transfer(recipient, amount), "Transfer should succeed");
        Assert.equal(crc20.balanceOf(recipient), amount, "Recipient should have 100 CLAW");
        Assert.equal(crc20.balanceOf(address(this)), (1000000 - 100) * 10 ** 18, "Sender should have 999,900 CLAW");
    }

    function testApproveAndTransferFrom() public {
        address spender = 0x0123456789012345678901234567890123456789;
        uint256 amount = 50 * 10 ** 18;
        Assert.isTrue(crc20.approve(spender, amount), "Approve should succeed");
        Assert.equal(crc20.allowance(address(this), spender), amount, "Allowance should be 50 CLAW");

        CRC20 spenderContract = CRC20(spender);
        Assert.isTrue(spenderContract.transferFrom(address(this), spender, amount), "TransferFrom should succeed");
        Assert.equal(crc20.balanceOf(address(this)), (1000000 - 50) * 10 ** 18, "Sender should have 999,950 CLAW");
        Assert.equal(crc20.balanceOf(spender), amount, "Spender should have 50 CLAW");
    }
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./Voting.sol";

contract ClawToken is ERC20 {
    Voting public votingContract;

    constructor(string memory name, string memory symbol, uint256 initialSupply) ERC20(name, symbol) {
        _mint(msg.sender, initialSupply);
        votingContract = new Voting(this);
    }

    function createProposal(string memory title, string memory description, uint256 duration) public {
        votingContract.createProposal(title, description, duration);
    }

    function vote(uint256 proposalId, uint256 amount) public {
        votingContract.vote(proposalId, amount);
    }

    function getProposal(uint256 proposalId)
        public
        view
        returns (
            uint256,
            string memory,
            string memory,
            uint256,
            uint256,
            uint256
        )
    {
        return votingContract.getProposal(proposalId);
    }
}
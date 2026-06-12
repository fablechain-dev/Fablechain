// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Governance.sol";

contract OpenChain {
    Governance public governance;

    constructor(IERC20 token, uint256 votingPeriod, uint256 quorumThreshold, uint256 approvalThreshold) {
        governance = new Governance(token, votingPeriod, quorumThreshold, approvalThreshold);
    }

    function proposeUpgrade(string memory description) public {
        governance.proposeUpgrade(description);
    }

    function vote(uint256 proposalId, bool support) public {
        governance.vote(proposalId, support);
    }

    function executeProposal(uint256 proposalId) public {
        governance.executeProposal(proposalId);
    }
}
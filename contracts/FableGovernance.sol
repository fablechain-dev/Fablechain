// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorTimelockControl.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IFableToken {
    function getPastVotes(address account, uint256 blockNumber) external view returns (uint256);
    function delegates(address account) external view returns (address);
}

interface ITimelockController {
    function schedule(
        address target,
        uint256 value,
        bytes calldata data,
        bytes32 predecessor,
        bytes32 salt,
        uint256 delay
    ) external;

    function execute(
        address target,
        uint256 value,
        bytes calldata data,
        bytes32 predecessor,
        bytes32 salt
    ) external payable;

    function cancel(bytes32 id) external;
    function isOperationReady(bytes32 id) external view returns (bool);
}

/// @title FableGovernance
/// @notice Governance contract for the Fablechain ecosystem
/// @dev Implements Governor pattern with timelock control for secure execution
contract FableGovernance is
    Governor,
    GovernorSettings,
    GovernorCountingSimple,
    GovernorVotes,
    GovernorVotesQuorumFraction,
    GovernorTimelockControl,
    Ownable
{
    // Events
    event ProposalThresholdUpdated(uint256 oldThreshold, uint256 newThreshold);
    event VotingDelayUpdated(uint256 oldDelay, uint256 newDelay);
    event VotingPeriodUpdated(uint256 oldPeriod, uint256 newPeriod);
    event QuorumUpdated(uint256 oldQuorum, uint256 newQuorum);

    // State variables
    uint256 private _proposalThreshold;
    ITimelockController public timelockController;

    // Proposal metadata storage
    mapping(uint256 => string) public proposalDescriptions;
    mapping(uint256 => uint256) public proposalCreationTime;

    /// @notice Initialize the governance contract
    /// @param _token Address of FABLE token with voting power
    /// @param _timelock Address of timelock controller
    /// @param initialVotingDelay Delay before voting starts (in blocks)
    /// @param initialVotingPeriod Duration of voting period (in blocks)
    /// @param initialQuorumNumerator Quorum as percentage (1-100)
    /// @param initialProposalThreshold Minimum tokens needed to propose
    constructor(
        IVotes _token,
        ITimelockController _timelock,
        uint48 initialVotingDelay,
        uint32 initialVotingPeriod,
        uint8 initialQuorumNumerator,
        uint256 initialProposalThreshold
    )
        Governor("FableGovernance")
        GovernorSettings(initialVotingDelay, initialVotingPeriod, initialProposalThreshold)
        GovernorVotes(_token)
        GovernorVotesQuorumFraction(initialQuorumNumerator)
        GovernorTimelockControl(_timelock)
    {
        timelockController = _timelock;
        _proposalThreshold = initialProposalThreshold;
    }

    /// @notice Update the proposal threshold
    /// @param newThreshold New threshold in FABLE tokens
    /// @dev Only callable by owner
    function updateProposalThreshold(uint256 newThreshold) external onlyOwner {
        require(newThreshold > 0, "FableGovernance: threshold must be greater than 0");
        uint256 oldThreshold = _proposalThreshold;
        _proposalThreshold = newThreshold;
        emit ProposalThresholdUpdated(oldThreshold, newThreshold);
    }

    /// @notice Get the current proposal threshold
    /// @return The minimum voting power required to create a proposal
    function proposalThreshold() public view override returns (uint256) {
        return _proposalThreshold;
    }

    /// @notice Create a governance proposal
    /// @param targets Array of target addresses for proposal actions
    /// @param values Array of ETH values to be sent with calls
    /// @param calldatas Array of encoded function calls
    /// @param description Proposal description containing title and motivation
    /// @return proposalId Unique identifier for the created proposal
    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) public override returns (uint256) {
        require(
            getVotes(msg.sender, block.number - 1) >= proposalThreshold(),
            "FableGovernance: proposer votes below proposal threshold"
        );

        uint256 proposalId = super.propose(targets, values, calldatas, description);
        proposalDescriptions[proposalId] = description;
        proposalCreationTime[proposalId] = block.timestamp;

        return proposalId;
    }

    /// @notice Cast a vote on a proposal
    /// @param proposalId ID of the proposal to vote on
    /// @param support Vote direction (0=Against, 1=For, 2=Abstain)
    /// @return weight The voting weight of the sender
    function castVote(uint256 proposalId, uint8 support)
        public
        override
        returns (uint256)
    {
        return super.castVote(proposalId, support);
    }

    /// @notice Cast a vote with a custom reason
    /// @param proposalId ID of the proposal
    /// @param support Vote direction
    /// @param reason Explanation for the vote
    /// @return weight Voting weight applied
    function castVoteWithReason(
        uint256 proposalId,
        uint8 support,
        string calldata reason
    ) public override returns (uint256) {
        return super.castVoteWithReason(proposalId, support, reason);
    }

    /// @notice Execute a proposal that has passed voting and exceeded timelock delay
    /// @param targets Array of target addresses
    /// @param values Array of ETH values
    /// @param calldatas Array of function calldata
    /// @param descriptionHash Hash of proposal description
    function execute(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) public payable override(Governor, GovernorTimelockControl) returns (uint256) {
        return super.execute(targets, values, calldatas, descriptionHash);
    }

    /// @notice Queue a proposal for execution through timelock
    /// @param targets Array of target addresses
    /// @param values Array of ETH values
    /// @param calldatas Array of function calldata
    /// @param descriptionHash Hash of proposal description
    function queue(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) public override(Governor, GovernorTimelockControl) returns (uint48) {
        return super.queue(targets, values, calldatas, descriptionHash);
    }

    /// @notice Cancel a pending proposal in timelock
    /// @param targets Array of target addresses
    /// @param values Array of ETH values
    /// @param calldatas Array of function calldata
    /// @param descriptionHash Hash of proposal description
    function cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) public override(Governor, GovernorTimelockControl) returns (uint48) {
        return super.cancel(targets, values, calldatas, descriptionHash);
    }

    /// @notice Get the voting delay in blocks
    /// @return delay Blocks until voting begins after proposal creation
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorTimelockControl.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IFableToken is IERC20 {
    function delegate(address delegatee) external;
}

/// @title FableGovernance
/// @notice Governance contract for the Fablechain project with proposal voting and timelock execution
/// @dev Implements OpenZeppelin Governor pattern with voting power delegation, quorum requirements, and timelock delays
contract FableGovernance is
    Governor,
    GovernorSettings,
    GovernorCountingSimple,
    GovernorVotes,
    GovernorVotesQuorumFraction,
    GovernorTimelockControl,
    Ownable
{
    enum ProposalType {
        PARAMETER_CHANGE,
        CONTRACT_UPGRADE,
        TREASURY_OPERATION,
        EMERGENCY_ACTION
    }

    struct ProposalMetadata {
        ProposalType proposalType;
        string ipfsHash;
        uint256 createdAt;
        address proposer;
        bool executed;
    }

    /// @notice Minimum token balance required to create a proposal
    uint256 public constant MIN_PROPOSAL_THRESHOLD = 1000e18;

    /// @notice Maps proposal IDs to their metadata
    mapping(uint256 => ProposalMetadata) public proposalMetadata;

    /// @notice Emitted when a proposal is created with metadata
    event ProposalCreatedWithMetadata(
        uint256 indexed proposalId,
        ProposalType indexed proposalType,
        string ipfsHash,
        address indexed proposer
    );

    /// @notice Emitted when a proposal is executed
    event ProposalExecutedWithMetadata(
        uint256 indexed proposalId,
        address indexed executor
    );

    /// @notice Emitted when voting parameters are updated
    event VotingParametersUpdated(
        uint256 votingDelay,
        uint256 votingPeriod,
        uint256 proposalThreshold,
        uint256 quorumNumerator
    );

    /// @notice Raised when caller lacks sufficient voting power for proposals
    error InsufficientVotingPower();

    /// @notice Raised when proposal type is invalid
    error InvalidProposalType();

    /// @notice Raised when IPFS hash is empty
    error InvalidIPFSHash();

    /// @notice Raised when timelock delay period has not elapsed
    error TimelockNotReady();

    constructor(
        IVotes _token,
        TimelockController _timelock,
        uint256 _votingDelay,
        uint256 _votingPeriod,
        uint256 _proposalThreshold,
        uint256 _quorumNumerator
    )
        Governor("FableGovernance")
        GovernorSettings(
            _votingDelay,
            _votingPeriod,
            _proposalThreshold
        )
        GovernorVotes(_token)
        GovernorVotesQuorumFraction(_quorumNumerator)
        GovernorTimelockControl(_timelock)
    {}

    /// @notice Create a governance proposal with metadata
    /// @param targets Array of target addresses for proposal actions
    /// @param values Array of ETH values to send with each action
    /// @param calldatas Array of encoded function calls
    /// @param description Human-readable description of the proposal
    /// @param proposalType Type of proposal being created
    /// @param ipfsHash IPFS hash containing detailed proposal documentation
    /// @return proposalId The ID of the created proposal
    function proposeWithMetadata(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description,
        ProposalType proposalType,
        string memory ipfsHash
    ) public returns (uint256) {
        if (ipfsHash[0] == 0) {
            revert InvalidIPFSHash();
        }

        if (uint256(proposalType) > 3) {
            revert InvalidProposalType();
        }

        uint256 voterWeight = getVotes(msg.sender, block.number - 1);
        if (voterWeight < proposalThreshold()) {
            revert InsufficientVotingPower();
        }

        uint256 proposalId = propose(
            targets,
            values,
            calldatas,
            description
        );

        proposalMetadata[proposalId] = ProposalMetadata({
            proposalType: proposalType,
            ipfsHash: ipfsHash,
            createdAt: block.timestamp,
            proposer: msg.sender,
            executed: false
        });

        emit ProposalCreatedWithMetadata(
            proposalId,
            proposalType,
            ipfsHash,
            msg.sender
        );

        return proposalId;
    }

    /// @notice Execute a proposal that has passed voting and met timelock requirements
    /// @param targets Array of target addresses for proposal actions
    /// @param values Array of ETH values to send with each action
    /// @param calldatas Array of encoded function calls
    /// @param descriptionHash Hash of the proposal description
    /// @param proposalId The ID of the proposal being executed
    function executeProposal(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash,
        uint256 proposalId
    ) public payable {
        ProposalState state = state(proposalId);
        require(
            state == ProposalState.Succeeded || state == ProposalState.Queued,
            "Proposal must be succeeded or queued"
        );

        if (state == ProposalState.Succeeded) {
            queue(targets, values, calldatas, descriptionHash);
        }

        uint256 eta = proposalEta(proposalId);
        require(block.timestamp >= eta, "Timelock delay not satisfied");

        _execute(targets, values, calldatas, descriptionHash, msg.sender);

        if (proposalMetadata[proposalId].proposer != address(0)) {
            proposalMetadata[proposalId].executed = true;
        }

        emit ProposalExecutedWithMetadata(proposalId, msg.sender);
    }

    /// @notice Get proposal metadata
    /// @param proposalId The ID of the proposal
    /// @return Tuple containing (proposalType, ipfsHash, createdAt, proposer, executed)
    function getProposalMetadata(uint256 proposalId)
        public
        view
        returns (
            ProposalType,
            string memory,
            uint256,
            address,
            bool
        )
    {
        ProposalMetadata memory meta = proposalMetadata[proposalId];
        return (
            meta.proposalType,
            meta.ipfsHash,
            meta.createdAt,
            meta.proposer,
            meta.executed
        );
    }

    /// @notice Check if a proposal has been executed
    /// @param proposalId The ID of the proposal
    /// @return true if proposal has been executed
    function hasExecuted(uint256 proposalId) public view returns (bool) {
        return proposalMetadata[proposalId].executed;
    }

    /// @notice Update governance voting parameters (owner only)
    /// @param newVotingDelay New voting delay in blocks
    /// @param newVotingPeriod New voting period in blocks
    /// @param newProposalThreshold New proposal threshold in tokens
    /// @param newQuorumNumerator New quorum as percentage (1-100)
    function updateVot
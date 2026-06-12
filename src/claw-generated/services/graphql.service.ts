import { Block, Transaction, Account, Contract, Staking, Governance, Proposal, Vote } from '../api/models';
import { BlockManager } from '../BlockManager';
import { AccountManager } from '../AccountManager';
import { ContractStorage } from '../ContractStorage';
import { StakingManager } from '../StakingManager';
import { GovernanceManager } from '../GovernanceManager';

export async function getBlock(number: number): Promise<Block> {
  const block = await BlockManager.getBlock(number);
  return {
    number: block.number,
    hash: block.hash,
    parentHash: block.parentHash,
    timestamp: block.timestamp,
    transactions: block.transactions.map(tx => ({
      hash: tx.hash,
      from: tx.from,
      to: tx.to,
      value: tx.value,
      gas: tx.gas,
      gasPrice: tx.gasPrice,
      input: tx.input,
      blockNumber: block.number,
      timestamp: block.timestamp
    }))
  };
}

export async function getTransaction(hash: string): Promise<Transaction> {
  const tx = await BlockManager.getTransaction(hash);
  return {
    hash: tx.hash,
    from: tx.from,
    to: tx.to,
    value: tx.value,
    gas: tx.gas,
    gasPrice: tx.gasPrice,
    input: tx.input,
    blockNumber: tx.blockNumber,
    timestamp: tx.timestamp
  };
}

export async function getAccount(address: string): Promise<Account> {
  const account = await AccountManager.getAccount(address);
  return {
    address: account.address,
    balance: account.balance,
    nonce: account.nonce,
    code: account.code
  };
}

export async function getContract(address: string): Promise<Contract> {
  const contract = await ContractStorage.getContract(address);
  return {
    address: contract.address,
    abi: contract.abi,
    bytecode: contract.bytecode
  };
}

export async function getStakingInfo(): Promise<Staking> {
  const { totalStaked, rewardRate, stakingPools } = await StakingManager.getStakingInfo();
  return {
    totalStaked,
    rewardRate,
    stakingPools: stakingPools.map(pool => ({
      address: pool.address,
      totalStaked: pool.totalStaked,
      apy: pool.apy
    }))
  };
}

export async function getGovernanceInfo(): Promise<Governance> {
  const { proposals, votes } = await GovernanceManager.getGovernanceInfo();
  return {
    proposals: proposals.map(proposal => ({
      id: proposal.id,
      title: proposal.title,
      description: proposal.description,
      status: proposal.status,
      votes: votes.filter(vote => vote.proposal === proposal.id).map(vote => ({
        voter: vote.voter,
        proposal: vote.proposal,
        support: vote.support
      }))
    })),
    votes: votes.map(vote => ({
      voter: vote.voter,
      proposal: vote.proposal,
      support: vote.support
    }))
  };
}

export async function getTransactionsByAddress(address: string): Promise<Transaction[]> {
  const txs = await BlockManager.getTransactionsByAddress(address);
  return txs.map(tx => ({
    hash: tx.hash,
    from: tx.from,
    to: tx.to,
    value: tx.value,
    gas: tx.gas,
    gasPrice: tx.gasPrice,
    input: tx.input,
    blockNumber: tx.blockNumber,
    timestamp: tx.timestamp
  }));
}
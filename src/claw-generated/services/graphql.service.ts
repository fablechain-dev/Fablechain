import { Block, Transaction, Account, Contract, Staking, Governance } from '../api/models';
import { BlockManager, TransactionManager, AccountManager, ContractManager, StakingManager, GovernanceManager } from '../managers';

export async function getBlock(number: number): Promise&lt;Block&gt; {
  const block = await BlockManager.getBlock(number);
  return {
    number: block.number,
    hash: block.hash,
    timestamp: block.timestamp,
    transactions: block.transactions.map(tx => ({
      hash: tx.hash,
      from: tx.from,
      to: tx.to,
      value: tx.value,
      gas: tx.gas,
      gasPrice: tx.gasPrice,
      nonce: tx.nonce,
      input: tx.input,
      blockNumber: tx.blockNumber
    })),
    miner: block.miner
  };
}

export async function getTransaction(hash: string): Promise&lt;Transaction&gt; {
  const tx = await TransactionManager.getTransaction(hash);
  return {
    hash: tx.hash,
    from: tx.from,
    to: tx.to,
    value: tx.value,
    gas: tx.gas,
    gasPrice: tx.gasPrice,
    nonce: tx.nonce,
    input: tx.input,
    blockNumber: tx.blockNumber
  };
}

export async function getAccount(address: string): Promise&lt;Account&gt; {
  const account = await AccountManager.getAccount(address);
  return {
    address: account.address,
    balance: account.balance,
    nonce: account.nonce,
    transactions: account.transactions.map(tx => ({
      hash: tx.hash,
      from: tx.from,
      to: tx.to,
      value: tx.value,
      gas: tx.gas,
      gasPrice: tx.gasPrice,
      nonce: tx.nonce,
      input: tx.input,
      blockNumber: tx.blockNumber
    }))
  };
}

export async function getContract(address: string): Promise&lt;Contract&gt; {
  const contract = await ContractManager.getContract(address);
  return {
    address: contract.address,
    creator: contract.creator,
    abi: contract.abi,
    bytecode: contract.bytecode,
    events: contract.events.map(event => ({
      name: event.name,
      parameters: event.parameters.map(param => ({
        name: param.name,
        type: param.type
      }))
    }))
  };
}

export function getStakingInfo(): Promise&lt;Staking&gt; {
  return StakingManager.getStakingInfo();
}

export function getGovernanceInfo(): Promise&lt;Governance&gt; {
  return GovernanceManager.getGovernanceInfo();
}
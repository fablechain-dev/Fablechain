import { Block, Transaction, Account, Contract, Staking, Governance, Proposal, Vote } from '../api/models';
import { getBlockByNumber, getTransactionByHash, getAccountByAddress, getContractByAddress, getStakingInfo, getGovernanceInfo, getTransactionsByAddress } from '../blockchain';

export const getBlock = async (number: number): Promise<Block> => {
  return await getBlockByNumber(number);
};

export const getTransaction = async (hash: string): Promise<Transaction> => {
  return await getTransactionByHash(hash);
};

export const getAccount = async (address: string): Promise<Account> => {
  return await getAccountByAddress(address);
};

export const getContract = async (address: string): Promise<Contract> => {
  return await getContractByAddress(address);
};

export const getStakingInfo = async (): Promise<Staking> => {
  return await getStakingInfo();
};

export const getGovernanceInfo = async (): Promise<Governance> => {
  return await getGovernanceInfo();
};

export const getTransactionsByAddress = async (address: string): Promise<Transaction[]> => {
  return await getTransactionsByAddress(address);
};
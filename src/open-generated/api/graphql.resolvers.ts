import { Block, Transaction, Account, StorageSlot } from '../models';
import { BlockchainManager, TransactionManager, AccountManager } from '../services';

export const resolvers = {
  Query: {
    block: async (_, { hash }) => {
      const block = await BlockchainManager.getBlock(hash);
      return block;
    },
    blocks: async (_, { limit, offset }) => {
      const blocks = await BlockchainManager.getBlocks(limit, offset);
      return blocks;
    },
    transaction: async (_, { hash }) => {
      const tx = await TransactionManager.getTransaction(hash);
      return tx;
    },
    transactions: async (_, { limit, offset }) => {
      const txs = await TransactionManager.getTransactions(limit, offset);
      return txs;
    },
    account: async (_, { address }) => {
      const account = await AccountManager.getAccount(address);
      return account;
    }
  },
  Block: {
    transactions: async (block) => {
      return block.transactions;
    }
  },
  Account: {
    storage: async (account) => {
      const slots = await AccountManager.getAccountStorage(account.address);
      return slots;
    }
  }
};
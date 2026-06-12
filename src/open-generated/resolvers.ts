import { BlockService } from '../services/BlockService';
import { TransactionService } from '../services/TransactionService';
import { AccountService } from '../services/AccountService';

export const resolvers = {
  Query: {
    block: async (_, { number, hash }) => {
      const blockService = new BlockService();
      return await blockService.getBlock(number, hash);
    },
    blocks: async (_, { limit, offset }) => {
      const blockService = new BlockService();
      return await blockService.getBlocks(limit, offset);
    },
    transaction: async (_, { hash }) => {
      const transactionService = new TransactionService();
      return await transactionService.getTransaction(hash);
    },
    account: async (_, { address }) => {
      const accountService = new AccountService();
      return await accountService.getAccount(address);
    }
  },
  Block: {
    transactions: async (block) => {
      const transactionService = new TransactionService();
      return await transactionService.getTransactionsForBlock(block.number);
    }
  },
  Account: {
    transactions: async (account) => {
      const transactionService = new TransactionService();
      return await transactionService.getTransactionsForAccount(account.address);
    }
  }
};
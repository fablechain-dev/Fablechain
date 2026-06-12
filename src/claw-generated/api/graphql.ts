import { GraphQLSchema, GraphQLObjectType, GraphQLString, GraphQLInt, GraphQLList, GraphQLNonNull } from 'graphql';
import { Block, Transaction, Account, Contract, Staking, Governance, Proposal, Vote } from './models';
import { getBlock, getTransaction, getAccount, getContract, getStakingInfo, getGovernanceInfo, getTransactionsByAddress } from '../services/graphql.service';

const RootQueryType = new GraphQLObjectType({
  name: 'Query',
  fields: {
    block: {
      type: Block,
      args: {
        number: { type: GraphQLInt }
      },
      resolve: (_, { number }) => getBlock(number)
    },
    transaction: {
      type: Transaction,
      args: {
        hash: { type: GraphQLString }
      },
      resolve: (_, { hash }) => getTransaction(hash)
    },
    account: {
      type: Account,
      args: {
        address: { type: GraphQLString }
      },
      resolve: (_, { address }) => getAccount(address)
    },
    contract: {
      type: Contract,
      args: {
        address: { type: GraphQLString }
      },
      resolve: (_, { address }) => getContract(address)
    },
    staking: {
      type: Staking,
      resolve: () => getStakingInfo()
    },
    governance: {
      type: Governance,
      resolve: () => getGovernanceInfo()
    },
    transactionsByAddress: {
      type: new GraphQLList(Transaction),
      args: {
        address: { type: GraphQLString }
      },
      resolve: (_, { address }) => getTransactionsByAddress(address)
    }
  }
});

export const schema = new GraphQLSchema({
  query: RootQueryType
});
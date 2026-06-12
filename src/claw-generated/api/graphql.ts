import { GraphQLSchema, GraphQLObjectType, GraphQLString, GraphQLInt, GraphQLList, GraphQLNonNull } from 'graphql';
import { Block, Transaction, Account, Contract, Staking, Governance, Proposal, Vote } from './models';
import { getBlock, getTransaction, getAccount, getContract, getStakingInfo, getGovernanceInfo, getTransactionsByAddress } from '../services/graphql.service';

const BlockType = new GraphQLObjectType({
  name: 'Block',
  fields: {
    number: { type: GraphQLInt },
    hash: { type: GraphQLString },
    parentHash: { type: GraphQLString },
    timestamp: { type: GraphQLInt },
    transactions: {
      type: new GraphQLList(TransactionType),
      resolve: (block) => getTransactionsByAddress(block.hash)
    }
  }
});

const TransactionType = new GraphQLObjectType({
  name: 'Transaction',
  fields: {
    hash: { type: GraphQLString },
    from: { type: GraphQLString },
    to: { type: GraphQLString },
    value: { type: GraphQLInt },
    gas: { type: GraphQLInt },
    gasPrice: { type: GraphQLInt },
    input: { type: GraphQLString },
    blockNumber: { type: GraphQLInt },
    timestamp: { type: GraphQLInt }
  }
});

const AccountType = new GraphQLObjectType({
  name: 'Account',
  fields: {
    address: { type: GraphQLString },
    balance: { type: GraphQLInt },
    nonce: { type: GraphQLInt },
    code: { type: GraphQLString },
    transactions: {
      type: new GraphQLList(TransactionType),
      resolve: (account) => getTransactionsByAddress(account.address)
    }
  }
});

const ContractType = new GraphQLObjectType({
  name: 'Contract',
  fields: {
    address: { type: GraphQLString },
    abi: { type: GraphQLString },
    bytecode: { type: GraphQLString }
  }
});

const StakingType = new GraphQLObjectType({
  name: 'Staking',
  fields: {
    totalStaked: { type: GraphQLInt },
    rewardRate: { type: GraphQLInt },
    stakingPools: { type: new GraphQLList(StakingPoolType) }
  }
});

const StakingPoolType = new GraphQLObjectType({
  name: 'StakingPool',
  fields: {
    address: { type: GraphQLString },
    totalStaked: { type: GraphQLInt },
    apy: { type: GraphQLInt }
  }
});

const GovernanceType = new GraphQLObjectType({
  name: 'Governance',
  fields: {
    proposals: { type: new GraphQLList(ProposalType) },
    votes: { type: new GraphQLList(VoteType) }
  }
});

const ProposalType = new GraphQLObjectType({
  name: 'Proposal',
  fields: {
    id: { type: GraphQLInt },
    title: { type: GraphQLString },
    description: { type: GraphQLString },
    status: { type: GraphQLString },
    votes: { type: new GraphQLList(VoteType) }
  }
});

const VoteType = new GraphQLObjectType({
  name: 'Vote',
  fields: {
    voter: { type: GraphQLString },
    proposal: { type: GraphQLInt },
    support: { type: GraphQLString }
  }
});

const RootQueryType = new GraphQLObjectType({
  name: 'Query',
  fields: {
    block: {
      type: BlockType,
      args: {
        number: { type: GraphQLInt }
      },
      resolve: (_, { number }) => getBlock(number)
    },
    transaction: {
      type: TransactionType,
      args: {
        hash: { type: GraphQLString }
      },
      resolve: (_, { hash }) => getTransaction(hash)
    },
    account: {
      type: AccountType,
      args: {
        address: { type: GraphQLString }
      },
      resolve: (_, { address }) => getAccount(address)
    },
    contract: {
      type: ContractType,
      args: {
        address: { type: GraphQLString }
      },
      resolve: (_, { address }) => getContract(address)
    },
    staking: {
      type: StakingType,
      resolve: () => getStakingInfo()
    },
    governance: {
      type: GovernanceType,
      resolve: () => getGovernanceInfo()
    },
    transactionsByAddress: {
      type: new GraphQLList(TransactionType),
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
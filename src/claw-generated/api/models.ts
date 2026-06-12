import { GraphQLObjectType, GraphQLString, GraphQLInt, GraphQLFloat, GraphQLList } from 'graphql';

export const Block = new GraphQLObjectType({
  name: 'Block',
  fields: {
    number: { type: GraphQLInt },
    hash: { type: GraphQLString },
    parentHash: { type: GraphQLString },
    timestamp: { type: GraphQLInt },
    transactions: { type: new GraphQLList(Transaction) },
    miner: { type: GraphQLString },
    size: { type: GraphQLInt },
    gasUsed: { type: GraphQLInt },
    gasLimit: { type: GraphQLInt },
    difficulty: { type: GraphQLFloat },
    totalDifficulty: { type: GraphQLFloat }
  }
});

export const Transaction = new GraphQLObjectType({
  name: 'Transaction',
  fields: {
    hash: { type: GraphQLString },
    blockNumber: { type: GraphQLInt },
    from: { type: GraphQLString },
    to: { type: GraphQLString },
    value: { type: GraphQLFloat },
    gas: { type: GraphQLInt },
    gasPrice: { type: GraphQLFloat },
    input: { type: GraphQLString },
    nonce: { type: GraphQLInt },
    status: { type: GraphQLInt },
    timestamp: { type: GraphQLInt }
  }
});

export const Account = new GraphQLObjectType({
  name: 'Account',
  fields: {
    address: { type: GraphQLString },
    balance: { type: GraphQLFloat },
    nonce: { type: GraphQLInt },
    code: { type: GraphQLString },
    storage: { type: new GraphQLList(GraphQLString) }
  }
});

export const Contract = new GraphQLObjectType({
  name: 'Contract',
  fields: {
    address: { type: GraphQLString },
    abi: { type: GraphQLString },
    bytecode: { type: GraphQLString },
    deployedAt: { type: GraphQLInt },
    owner: { type: GraphQLString }
  }
});

export const Staking = new GraphQLObjectType({
  name: 'Staking',
  fields: {
    totalStaked: { type: GraphQLFloat },
    validatorCount: { type: GraphQLInt },
    rewardRate: { type: GraphQLFloat },
    minimumStake: { type: GraphQLFloat }
  }
});

export const Governance = new GraphQLObjectType({
  name: 'Governance',
  fields: {
    proposals: { type: new GraphQLList(Proposal) },
    votes: { type: new GraphQLList(Vote) }
  }
});

export const Proposal = new GraphQLObjectType({
  name: 'Proposal',
  fields: {
    id: { type: GraphQLInt },
    title: { type: GraphQLString },
    description: { type: GraphQLString },
    author: { type: GraphQLString },
    status: { type: GraphQLString },
    createdAt: { type: GraphQLInt },
    votingEndAt: { type: GraphQLInt }
  }
});

export const Vote = new GraphQLObjectType({
  name: 'Vote',
  fields: {
    proposalId: { type: GraphQLInt },
    voter: { type: GraphQLString },
    support: { type: GraphQLInt },
    votedAt: { type: GraphQLInt }
  }
});
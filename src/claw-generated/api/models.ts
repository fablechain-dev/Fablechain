import { GraphQLObjectType, GraphQLString, GraphQLInt, GraphQLList } from 'graphql';

export const Block = new GraphQLObjectType({
  name: 'Block',
  fields: {
    number: { type: GraphQLInt },
    hash: { type: GraphQLString },
    timestamp: { type: GraphQLInt },
    transactions: { type: new GraphQLList(Transaction) },
    miner: { type: GraphQLString }
  }
});

export const Transaction = new GraphQLObjectType({
  name: 'Transaction',
  fields: {
    hash: { type: GraphQLString },
    from: { type: GraphQLString },
    to: { type: GraphQLString },
    value: { type: GraphQLString },
    gas: { type: GraphQLInt },
    gasPrice: { type: GraphQLString },
    nonce: { type: GraphQLInt },
    input: { type: GraphQLString },
    blockNumber: { type: GraphQLInt }
  }
});

export const Account = new GraphQLObjectType({
  name: 'Account',
  fields: {
    address: { type: GraphQLString },
    balance: { type: GraphQLString },
    nonce: { type: GraphQLInt },
    transactions: { type: new GraphQLList(Transaction) }
  }
});

export const Contract = new GraphQLObjectType({
  name: 'Contract',
  fields: {
    address: { type: GraphQLString },
    creator: { type: GraphQLString },
    abi: { type: GraphQLString },
    bytecode: { type: GraphQLString },
    events: { type: new GraphQLList(Event) }
  }
});

export const Event = new GraphQLObjectType({
  name: 'Event',
  fields: {
    name: { type: GraphQLString },
    parameters: { type: new GraphQLList(EventParameter) }
  }
});

export const EventParameter = new GraphQLObjectType({
  name: 'EventParameter',
  fields: {
    name: { type: GraphQLString },
    type: { type: GraphQLString }
  }
});

export const Staking = new GraphQLObjectType({
  name: 'Staking',
  fields: {
    totalStaked: { type: GraphQLString },
    rewardRate: { type: GraphQLString },
    minimumStake: { type: GraphQLString }
  }
});

export const Governance = new GraphQLObjectType({
  name: 'Governance',
  fields: {
    proposals: { type: new GraphQLList(Proposal) },
    votingPower: { type: GraphQLString },
    quorum: { type: GraphQLString },
    passThreshold: { type: GraphQLString }
  }
});

export const Proposal = new GraphQLObjectType({
  name: 'Proposal',
  fields: {
    id: { type: GraphQLString },
    title: { type: GraphQLString },
    description: { type: GraphQLString },
    status: { type: GraphQLString },
    votes: { type: new GraphQLList(Vote) },
    createdAt: { type: GraphQLInt },
    endAt: { type: GraphQLInt }
  }
});

export const Vote = new GraphQLObjectType({
  name: 'Vote',
  fields: {
    voter: { type: GraphQLString },
    support: { type: GraphQLInt },
    votingPower: { type: GraphQLString }
  }
});
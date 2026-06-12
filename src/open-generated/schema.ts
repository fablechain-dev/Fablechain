import { makeExecutableSchema } from '@graphql-tools/schema';
import { resolvers } from './resolvers';

const typeDefs = `
  type Query {
    block(number: Int, hash: String): Block
    blocks(limit: Int, offset: Int): [Block]
    transaction(hash: String): Transaction
    account(address: String): Account
  }

  type Block {
    number: Int!
    hash: String!
    timestamp: String!
    transactions: [Transaction]
  }

  type Transaction {
    hash: String!
    from: String!
    to: String!
    value: String!
    data: String
  }

  type Account {
    address: String!
    balance: String!
    transactions: [Transaction]
  }
`;

export const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});
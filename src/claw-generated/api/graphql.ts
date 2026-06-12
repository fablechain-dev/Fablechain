import { gql } from 'apollo-server-express';

// GraphQL Schema
export const typeDefs = gql`
  type Query {
    block(hash: String): Block
    blocks(limit: Int, offset: Int): [Block!]!
    transaction(hash: String): Transaction
    transactions(limit: Int, offset: Int): [Transaction!]!
    account(address: String): Account
  }

  type Block {
    hash: String!
    number: Int!
    timestamp: Int!
    transactions: [Transaction!]!
    size: Int!
    gasUsed: Int!
    gasLimit: Int!
    miner: String!
    difficulty: Int!
    totalDifficulty: Int!
    nonce: String!
    extraData: String!
    parentHash: String!
  }

  type Transaction {
    hash: String!
    from: String!
    to: String!
    value: String!
    gas: Int!
    gasPrice: String!
    nonce: Int!
    input: String!
    v: String!
    r: String!
    s: String!
    blockHash: String
    blockNumber: Int
    transactionIndex: Int
  }

  type Account {
    address: String!
    balance: String!
    nonce: Int!
    code: String
    storage: [StorageSlot!]!
  }

  type StorageSlot {
    key: String!
    value: String!
  }
`;
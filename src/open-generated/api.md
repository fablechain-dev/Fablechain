# OpenChain API Documentation

## RPC Methods

### `simulateTransaction`

Simulates the execution of a transaction without modifying the state of the blockchain.

**Parameters:**
- `tx`: `string` - The base64-encoded transaction to simulate.

**Returns:**
- `logs`: `Array<string>` - The logs generated during the transaction simulation.
- `computeUnits`: `number` - The compute units used during the transaction simulation.

**Example:**

```javascript
const result = await rpcClient.call('simulateTransaction', ['AQIDBAUGBwgJCgsMDQ4PEA==']);
console.log(result.logs);
console.log(result.computeUnits);
```

## GraphQL API

The OpenChain network also provides a GraphQL API for querying blockchain data. The schema and resolvers can be found in the `src/open-generated/api/graphql.ts` file.

## HTTP API

In addition to the RPC and GraphQL APIs, OpenChain provides a set of HTTP endpoints for common operations. These are defined in the `src/open-generated/api` directory.

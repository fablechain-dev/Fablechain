# ClawChain RPC API

## `getAccountInfo`
Fetch account data for a given public key.

### Parameters
- `pubkey: string` - The public key of the account to fetch.

### Return Value
```typescript
{
  data: Uint8Array; // The account's data
  lamports: number; // The account's balance in lamports
  owner: string; // The account's owner public key
  executable: boolean; // Whether the account is executable
} | null
```

If the account is not found, `null` is returned.

### Example
```typescript
const accountInfo = await rpcMethods.getAccountInfo('9h3ePfJ7NXzDvXCxrX4ZUTdQxmXdwwm3Fy6qJUZCrAHj');
console.log(accountInfo);
```

## `getSignaturesForAddress`
Retrieve a list of transaction signatures associated with a given address.

### Parameters
- `address: string` - The public key of the address to fetch signatures for.
- `limit?: number` - The maximum number of signatures to return (default: 1000).
- `before?: string` - A signature to start fetching results before (exclusive).
- `until?: string` - A signature to stop fetching results at (inclusive).

### Return Value
```typescript
{
  signatures: string[]; // The list of transaction signatures
  before?: string; // The signature to start fetching results before (next page)
  until?: string; // The signature to stop fetching results at (next page)
}
```

### Example
```typescript
const signatures = await rpcMethods.getSignaturesForAddress('9h3ePfJ7NXzDvXCxrX4ZUTdQxmXdwwm3Fy6qJUZCrAHj', {
  limit: 10,
  before: '5h3ePfJ7NXzDvXCxrX4ZUTdQxmXdwwm3Fy6qJUZCrAHj'
});
console.log(signatures);
```

## `getTransaction`
Retrieve a transaction by its signature.

### Parameters
- `signature: string` - The signature of the transaction to fetch.

### Return Value
```typescript
{
  transaction: Transaction; // The transaction object
  meta: TransactionReceipt; // The transaction receipt (metadata)
} | null
```

If the transaction is not found, `null` is returned.

### Example
```typescript
const transactionData = await rpcMethods.getTransaction('5h3ePfJ7NXzDvXCxrX4ZUTdQxmXdwwm3Fy6qJUZCrAHj');
console.log(transactionData);
```
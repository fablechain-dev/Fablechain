import { Connection, PublicKey, TransactionSignature } from '@solana/web3.js';

export async function getTransactionSignaturesForAddress(
  connection: Connection,
  address: PublicKey,
  { limit = 1000, before, until }: { limit?: number; before?: string; until?: string }
): Promise&lt;{ signature: string }[]&gt; {
  const signatures: { signature: string }[] = [];

  let firstSignature: string | undefined = before;
  let lastSignature: string | undefined = until;

  while (signatures.length < limit) {
    const resp = await connection.getSignaturesForAddress(address, {
      limit: limit - signatures.length,
      until: lastSignature,
      before: firstSignature,
    });

    signatures.push(...resp.map((s) => ({ signature: s.signature })));

    if (resp.length < limit - signatures.length) {
      break;
    }

    firstSignature = resp[0].signature;
    lastSignature = resp[resp.length - 1].signature;
  }

  return signatures;
}
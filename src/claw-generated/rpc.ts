import { Block } from '../Block';

export async function getBlock(slot: number, options: { 
  encoding?: 'json' | 'binary'
  transactionDetails?: 'full' | 'partial' | 'none'
}): Promise<Block> {
  // Fetch the block from the chain by slot number
  const block = await Chain.getBlockBySlot(slot);

  // Apply the requested encoding and transaction details
  if (options.encoding === 'binary') {
    block.encodeTransactions('binary');
  } else {
    block.encodeTransactions('json');
  }

  if (options.transactionDetails === 'partial') {
    block.transactions = block.transactions.map(tx => ({
      signature: tx.signature,
      message: tx.message
    }));
  } else if (options.transactionDetails === 'none') {
    block.transactions = [];
  }

  return block;
}
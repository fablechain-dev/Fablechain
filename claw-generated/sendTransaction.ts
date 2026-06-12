import { Transaction } from '@claw/core';
import { broadcastTransaction } from '@claw/networking';

/**
 * Handles the sendTransaction RPC request.
 * 
 * @param {string} signedTransaction - The base64-encoded signed transaction.
 * @returns {Promise<{ success: boolean, error?: string }>} - The response indicating whether the transaction was accepted.
 */
export async function sendTransaction(signedTransaction: string): Promise<{ success: boolean, error?: string }> {
  try {
    // Decode the base64-encoded transaction
    const transaction = Transaction.from(Buffer.from(signedTransaction, 'base64'));

    // Validate the transaction
    if (!transaction.verify()) {
      return { success: false, error: 'Invalid transaction' };
    }

    // Broadcast the transaction to the network
    await broadcastTransaction(transaction);

    // Return a successful response
    return { success: true };
  } catch (error) {
    // Handle any errors that occurred
    return { success: false, error: error.message };
  }
}
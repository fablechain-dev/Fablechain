import { Transaction } from '../transaction/transaction';
import { TransactionProcessor } from '../transaction/transactionProcessor';

export async function sendTransaction(params: any): Promise<any> {
  try {
    const { signedTransaction } = params;

    // Decode the base64-encoded signed transaction
    const transaction = Transaction.deserialize(signedTransaction);

    // Validate the transaction
    if (!transaction.verifySignature()) {
      return {
        error: 'Invalid transaction signature'
      };
    }

    // Calculate the transaction fee
    const fee = transaction.calculateFee();

    // Process the transaction
    await TransactionProcessor.processTransaction(transaction);

    // Generate the transaction receipt
    const receipt = transaction.generateReceipt();

    return {
      result: {
        transactionHash: transaction.hash,
        fee: receipt.fee
      }
    };
  } catch (error) {
    return {
      error: error.message
    };
  }
}
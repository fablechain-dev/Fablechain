import { Transaction } from './transaction';

export class TransactionValidator {
  static async validate(tx: Transaction): Promise<void> {
    // Validate transaction format
    if (!tx.isValid()) {
      throw new Error('Invalid transaction format');
    }

    // Verify transaction signatures
    await tx.verifySignatures();
  }
}
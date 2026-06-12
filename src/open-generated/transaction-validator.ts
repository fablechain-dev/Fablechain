import { Account } from "../account/account";
import { Transaction } from "./transaction";
import { recoverPersonalSignature } from "eth-sig-util";

export class TransactionValidator {
  verifySignature(tx: Transaction): boolean {
    try {
      const signerAddress = recoverPersonalSignature({
        data: tx.hash(),
        sig: tx.signature,
      });
      return signerAddress === tx.from;
    } catch (e) {
      return false;
    }
  }

  validateNonce(tx: Transaction, account: Account): boolean {
    return tx.nonce === account.nonce;
  }

  validateBalance(tx: Transaction, account: Account): boolean {
    return account.balance >= tx.value;
  }
}
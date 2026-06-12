import { Transaction, TransactionReceipt } from '../core/transaction';
import { Account } from '../core/account';
import { keccak256 } from 'js-sha3';
import { AbiCoder } from '../utils/abi-coder';

export class ContractDeployer {
  constructor(private account: Account) {}

  async deployContract(bytecode: string, args: any[] = []): Promise<TransactionReceipt> {
    const transaction = new Transaction({
      from: this.account.address,
      data: bytecode + this.encodeArgs(args),
      gasLimit: 6000000, // TODO: Estimate gas limit
    });

    await this.account.signTransaction(transaction);
    return await transaction.send();
  }

  getContractAddress(transaction: Transaction): string {
    const address = keccak256(
      Buffer.concat([
        Buffer.from(transaction.from, 'hex'),
        Buffer.from(transaction.nonce.toString(16), 'hex'),
      ])
    ).slice(64 - 40);
    return '0x' + address;
  }

  private encodeArgs(args: any[]): string {
    const abiCoder = new AbiCoder();
    return abiCoder.encode(args);
  }
}
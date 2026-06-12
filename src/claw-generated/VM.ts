import { Contract } from '../contracts/Contract';
import { ExecutionContext } from './ExecutionContext';

export class VM {
  private contracts: Map<string, Contract> = new Map();

  public registerContract(contract: Contract) {
    this.contracts.set(contract.address, contract);
  }

  public executeContract(context: ExecutionContext): any {
    const contract = this.contracts.get(context.to);
    if (!contract) {
      throw new Error(`Contract at ${context.to} not found`);
    }

    if (context.opcode === 'CALL') {
      const { to, value, gas } = context.parameters;
      const result = this.executeCall(to, value, gas, context);
      return result;
    }

    return contract.execute(context);
  }

  private executeCall(to: string, value: bigint, gas: bigint, context: ExecutionContext): any {
    const calledContract = this.contracts.get(to);
    if (!calledContract) {
      throw new Error(`Contract at ${to} not found`);
    }

    const callContext: ExecutionContext = {
      ...context,
      to,
      value,
      gas,
      opcode: 'CALL'
    };

    return calledContract.execute(callContext);
  }
}
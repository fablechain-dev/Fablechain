import { ExecutionContext } from '../vm/ExecutionContext';
import { VM } from '../vm/VM';

export class Contract {
  public address: string;
  private storage: Map<string, any> = new Map();
  private vm: VM;

  constructor(address: string, vm: VM) {
    this.address = address;
    this.vm = vm;
  }

  public execute(context: ExecutionContext): any {
    switch (context.opcode) {
      case 'CALL':
        return this.handleCall(context);
      case 'DEPLOY':
        return this.handleDeploy(context);
      case 'STORE':
        return this.handleStore(context);
      case 'LOAD':
        return this.handleLoad(context);
      default:
        throw new Error(`Unsupported opcode: ${context.opcode}`);
    }
  }

  private handleCall(context: ExecutionContext): any {
    const { to, value, gas } = context.parameters;
    const result = this.vm.executeContract({
      ...context,
      to,
      value,
      gas,
      opcode: 'CALL'
    });
    return result;
  }

  private handleDeploy(context: ExecutionContext): any {
    // TODO: Implement DEPLOY opcode logic
    return null;
  }

  private handleStore(context: ExecutionContext): any {
    const { key, value } = context.parameters;
    this.storage.set(key, value);
    return value;
  }

  private handleLoad(context: ExecutionContext): any {
    const { key } = context.parameters;
    return this.storage.get(key);
  }
}
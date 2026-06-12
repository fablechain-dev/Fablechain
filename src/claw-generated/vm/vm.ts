import { Instruction } from './instruction';
import { ExecutionContext } from './types';

export class VirtualMachine {
  private stack: number[] = [];
  private pc: number = 0;
  private callStack: ExecutionContext[] = [];

  constructor() {}

  execute(bytecode: Instruction[]) {
    while (this.pc < bytecode.length) {
      this.executeInstruction(bytecode[this.pc]);
      this.pc++;
    }
  }

  private executeInstruction(instruction: Instruction) {
    switch (instruction) {
      case Instruction.PUSH:
        this.stack.push(0); // TODO: Implement PUSH
        break;
      case Instruction.POP:
        this.stack.pop(); // TODO: Implement POP
        break;
      case Instruction.ADD:
        const a = this.stack.pop();
        const b = this.stack.pop();
        this.stack.push(a + b);
        break;
      case Instruction.SUB:
        const x = this.stack.pop();
        const y = this.stack.pop();
        this.stack.push(y - x);
        break;
      case Instruction.MUL:
        const c = this.stack.pop();
        const d = this.stack.pop();
        this.stack.push(c * d);
        break;
      case Instruction.DIV:
        const e = this.stack.pop();
        const f = this.stack.pop();
        if (e === 0) {
          throw new Error('Division by zero');
        }
        this.stack.push(f / e);
        break;
      case Instruction.JUMP:
        const jumpTarget = this.stack.pop();
        this.pc = jumpTarget;
        break;
      case Instruction.JUMPI:
        const condition = this.stack.pop();
        const target = this.stack.pop();
        if (condition !== 0) {
          this.pc = target;
        }
        break;
      case Instruction.STOP:
        this.pc = this.bytecode.length;
        break;
      case Instruction.CALL:
        this.handleCall();
        break;
      case Instruction.RETURN:
        this.handleReturn();
        break;
      default:
        throw new Error(`Unknown instruction: ${instruction}`);
    }
  }

  private handleCall() {
    // 1. Pop the call parameters (contract address, function selector, etc.) from the stack
    const contractAddress = this.stack.pop();
    const functionSelector = this.stack.pop();
    const numArgs = this.stack.pop();
    const args = [];
    for (let i = 0; i < numArgs; i++) {
      args.push(this.stack.pop());
    }

    // 2. Create a new execution context with the call parameters
    const context: ExecutionContext = {
      contractAddress,
      functionSelector,
      args,
      gas: 0, // TODO: Handle gas forwarding
      returnAddress: this.pc,
    };

    // 3. Push the current execution context to the call stack
    this.callStack.push(this.currentContext);

    // 4. Load the called contract's bytecode and execute it using the new context
    this.currentContext = context;
    this.execute(this.getContractBytecode(contractAddress));

    // 5. When the called contract returns, pop the previous context from the call stack and resume
    this.currentContext = this.callStack.pop();
  }

  private handleReturn() {
    // 1. Pop the return value from the stack
    const returnValue = this.stack.pop();

    // 2. Restore the previous execution context from the call stack
    this.currentContext = this.callStack.pop();

    // 3. Resume execution at the calling contract
    this.stack.push(returnValue);
    this.pc = this.currentContext.returnAddress;
  }

  private getContractBytecode(address: number): Instruction[] {
    // TODO: Implement contract storage lookup to fetch the bytecode
    return [];
  }

  private get currentContext(): ExecutionContext {
    return this.callStack[this.callStack.length - 1];
  }

  private set currentContext(context: ExecutionContext) {
    this.callStack[this.callStack.length - 1] = context;
  }

  private bytecode: Instruction[] = [];
}
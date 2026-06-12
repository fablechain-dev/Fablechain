import { Stack } from './stack';
import { Opcode, GAS_COSTS } from './opcodes';

class VirtualMachine {
  private stack: Stack;
  private gas: number;
  private gasLimit: number;

  constructor(gasLimit: number) {
    this.stack = new Stack();
    this.gas = 0;
    this.gasLimit = gasLimit;
  }

  execute(bytecode: Uint8Array): void {
    for (let i = 0; i < bytecode.length; i++) {
      const opcode = bytecode[i];
      const gasRequired = GAS_COSTS[opcode] || 0;
      if (this.gas + gasRequired > this.gasLimit) {
        throw new Error('Out of gas');
      }
      this.executeOpcode(opcode);
      this.gas += gasRequired;
    }
  }

  private executeOpcode(opcode: number): void {
    switch (opcode) {
      case Opcode.PUSH1:
        this.stack.push(1);
        break;
      case Opcode.ADD:
        this.stack.push(this.stack.pop() + this.stack.pop());
        break;
      case Opcode.PUSH2:
        this.stack.push(2);
        break;
      case Opcode.MUL:
        this.stack.push(this.stack.pop() * this.stack.pop());
        break;
      case Opcode.DUP1:
        this.stack.push(this.stack.peek());
        break;
      default:
        throw new Error(`Unknown opcode: ${opcode}`);
    }
  }
}

export { VirtualMachine };
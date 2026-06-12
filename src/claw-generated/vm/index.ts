import { Stack } from './stack';
import { Opcode } from './opcodes';

class VirtualMachine {
  private stack: Stack;

  constructor() {
    this.stack = new Stack();
  }

  execute(bytecode: Uint8Array): void {
    for (let i = 0; i < bytecode.length; i++) {
      const opcode = bytecode[i];
      this.executeOpcode(opcode);
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
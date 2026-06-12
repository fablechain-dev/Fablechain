import { Instruction, MemorySlot, Stack } from './types';

class VirtualMachine {
  private stack: Stack = [];
  private memory: MemorySlot[] = [];

  execute(instructions: Instruction[]) {
    for (const instruction of instructions) {
      this.executeInstruction(instruction);
    }
  }

  private executeInstruction(instruction: Instruction) {
    switch (instruction.opcode) {
      case 'PUSH':
        this.stack.push(instruction.operand);
        break;
      case 'POP':
        this.stack.pop();
        break;
      case 'ADD':
        this.stack.push(this.stack.pop() + this.stack.pop());
        break;
      case 'MUL':
        this.stack.push(this.stack.pop() * this.stack.pop());
        break;
      // Add more instruction handlers here
    }
  }
}

export { VirtualMachine };
import { Instruction } from './instruction';

export class VirtualMachine {
  private stack: number[] = [];
  private pc: number = 0;

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
      default:
        throw new Error(`Unknown instruction: ${instruction}`);
    }
  }

  private bytecode: Instruction[] = [];
}
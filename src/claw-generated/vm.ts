import { ExecutionContext } from '../types';

export class VirtualMachine {
  private stack: number[] = [];
  private memory: Map<number, number> = new Map();

  execute(context: ExecutionContext): void {
    const { bytecode } = context;
    let pc = 0;

    while (pc < bytecode.length) {
      const opcode = bytecode[pc];
      switch (opcode) {
        case 0x01: // PUSH
          this.pushToStack(bytecode[++pc]);
          pc++;
          break;
        case 0x02: // POP
          this.popFromStack();
          pc++;
          break;
        case 0x03: // LOAD
          const address = this.popFromStack();
          this.pushToStack(this.getMemoryValue(address));
          pc++;
          break;
        case 0x04: // STORE
          const value = this.popFromStack();
          const storeAddress = this.popFromStack();
          this.setMemoryValue(storeAddress, value);
          pc++;
          break;
        case 0x05: // ADD
          const b = this.popFromStack();
          const a = this.popFromStack();
          this.pushToStack(a + b);
          pc++;
          break;
        case 0x06: // SUB
          const d = this.popFromStack();
          const c = this.popFromStack();
          this.pushToStack(c - d);
          pc++;
          break;
        case 0x07: // MUL
          const f = this.popFromStack();
          const e = this.popFromStack();
          this.pushToStack(e * f);
          pc++;
          break;
        case 0x08: // DIV
          const h = this.popFromStack();
          const g = this.popFromStack();
          this.pushToStack(Math.floor(g / h));
          pc++;
          break;
        default:
          throw new Error(`Unknown opcode: ${opcode}`);
      }
    }
  }

  private pushToStack(value: number): void {
    this.stack.push(value);
  }

  private popFromStack(): number {
    return this.stack.pop() as number;
  }

  private getMemoryValue(address: number): number {
    return this.memory.get(address) || 0;
  }

  private setMemoryValue(address: number, value: number): void {
    this.memory.set(address, value);
  }
}
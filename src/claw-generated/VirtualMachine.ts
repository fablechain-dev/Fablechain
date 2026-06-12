export class VirtualMachine {
  private gasLimit: number;
  private gasUsed: number;
  private stack: number[] = [];

  constructor(gasLimit: number) {
    this.gasLimit = gasLimit;
    this.gasUsed = 0;
  }

  execute(bytecode: Uint8Array): any {
    let ip = 0; // Instruction pointer
    while (ip < bytecode.length) {
      const opcode = bytecode[ip];
      const gasCost = this.getGasCost(opcode);
      if (!this.useGas(gasCost)) {
        throw new Error('Out of gas');
      }
      this.executeOperation(bytecode, ip);
      ip += 1;
    }
    return this.stack.pop(); // Return the final stack value
  }

  private useGas(amount: number): boolean {
    this.gasUsed += amount;
    return this.gasUsed <= this.gasLimit;
  }

  private getGasCost(opcode: number): number {
    switch (opcode) {
      case 0x01: // ADD
        return 3;
      case 0x02: // MUL
        return 5;
      case 0x03: // PUSH
        return 2;
      case 0x04: // POP
        return 2;
      default:
        return 1; // Default gas cost
    }
  }

  private executeOperation(bytecode: Uint8Array, ip: number): void {
    const opcode = bytecode[ip];
    switch (opcode) {
      case 0x01: // ADD
        this.add();
        break;
      case 0x02: // MUL
        this.mul();
        break;
      case 0x03: // PUSH
        this.push(bytecode[ip + 1]);
        ip += 1;
        break;
      case 0x04: // POP
        this.pop();
        break;
      default:
        throw new Error(`Invalid opcode: ${opcode}`);
    }
  }

  private push(value: number): void {
    this.stack.push(value);
  }

  private pop(): number {
    return this.stack.pop() || 0;
  }

  private add(): void {
    const b = this.pop();
    const a = this.pop();
    this.push(a + b);
  }

  private mul(): void {
    const b = this.pop();
    const a = this.pop();
    this.push(a * b);
  }
}
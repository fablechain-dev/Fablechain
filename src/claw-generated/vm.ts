import { Instruction, StackItem } from './types';
import { GAS_COSTS } from './gas-costs';

export class VM {
  private stack: StackItem[] = [];
  private memory: Uint8Array = new Uint8Array();
  private programCounter = 0;
  private gasRemaining: number;

  constructor(initialGas: number) {
    this.gasRemaining = initialGas;
  }

  execute(instructions: Instruction[]): void {
    for (const instruction of instructions) {
      this.executeInstruction(instruction);
    }
  }

  private executeInstruction(instruction: Instruction): void {
    const opGasCost = GAS_COSTS[instruction.opcode] || 0;
    this.gasRemaining -= opGasCost;

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
      // Add more opcodes here...
    }

    this.programCounter++;

    if (this.gasRemaining <= 0) {
      throw new Error('Ran out of gas');
    }
  }

  getGasRemaining(): number {
    return this.gasRemaining;
  }
}
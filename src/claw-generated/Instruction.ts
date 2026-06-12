export class Instruction {
  opcode: number;
  operand1: number;
  operand2: number;

  constructor(opcode: number, operand1: number, operand2: number) {
    this.opcode = opcode;
    this.operand1 = operand1;
    this.operand2 = operand2;
  }
}
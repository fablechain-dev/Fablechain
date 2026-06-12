export type Instruction = {
  opcode: 'PUSH' | 'POP' | 'ADD' | 'MUL';
  operand: number;
};

export type MemorySlot = {
  address: number;
  value: number;
};

export type Stack = number[];
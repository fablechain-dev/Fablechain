export enum Opcode {
  PUSH1 = 0x60,
  ADD = 0x01,
  PUSH2 = 0x61,
  MUL = 0x02,
  DUP1 = 0x80,
}

export const GAS_COSTS: { [key: number]: number } = {
  [Opcode.PUSH1]: 3,
  [Opcode.ADD]: 3,
  [Opcode.PUSH2]: 3,
  [Opcode.MUL]: 5,
  [Opcode.DUP1]: 3,
};
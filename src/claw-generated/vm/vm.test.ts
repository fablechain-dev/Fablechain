import { VirtualMachine } from './index';
import { Opcode } from './opcodes';

describe('VirtualMachine', () => {
  let vm: VirtualMachine;

  beforeEach(() => {
    vm = new VirtualMachine();
  });

  test('PUSH1 and ADD', () => {
    const bytecode = new Uint8Array([Opcode.PUSH1, Opcode.PUSH1, Opcode.ADD]);
    vm.execute(bytecode);
    expect(vm.stack.peek()).toBe(2);
  });

  test('PUSH2 and MUL', () => {
    const bytecode = new Uint8Array([Opcode.PUSH2, Opcode.PUSH2, Opcode.MUL]);
    vm.execute(bytecode);
    expect(vm.stack.peek()).toBe(4);
  });

  test('DUP1', () => {
    const bytecode = new Uint8Array([Opcode.PUSH1, Opcode.DUP1]);
    vm.execute(bytecode);
    expect(vm.stack.peek()).toBe(1);
    expect(vm.stack.items.length).toBe(2);
  });

  test('Unknown opcode', () => {
    const bytecode = new Uint8Array([0xFF]);
    expect(() => vm.execute(bytecode)).toThrowError('Unknown opcode: 255');
  });
});
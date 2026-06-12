import { VirtualMachine } from './vm';

describe('VirtualMachine', () => {
  let vm: VirtualMachine;

  beforeEach(() => {
    vm = new VirtualMachine();
  });

  it('should push and pop values from the stack', () => {
    vm.pushToStack(10);
    vm.pushToStack(20);
    expect(vm.popFromStack()).toBe(20);
    expect(vm.popFromStack()).toBe(10);
  });

  it('should load and store values in memory', () => {
    vm.setMemoryValue(0, 100);
    expect(vm.getMemoryValue(0)).toBe(100);
  });

  it('should perform arithmetic operations', () => {
    vm.pushToStack(10);
    vm.pushToStack(20);
    vm.execute({ bytecode: [0x05] }); // ADD
    expect(vm.popFromStack()).toBe(30);

    vm.pushToStack(30);
    vm.pushToStack(10);
    vm.execute({ bytecode: [0x06] }); // SUB
    expect(vm.popFromStack()).toBe(20);

    vm.pushToStack(5);
    vm.pushToStack(3);
    vm.execute({ bytecode: [0x07] }); // MUL
    expect(vm.popFromStack()).toBe(15);

    vm.pushToStack(10);
    vm.pushToStack(3);
    vm.execute({ bytecode: [0x08] }); // DIV
    expect(vm.popFromStack()).toBe(3);
  });

  it('should throw an error for unknown opcodes', () => {
    expect(() => vm.execute({ bytecode: [0xFF] })).toThrowError('Unknown opcode: 255');
  });
});
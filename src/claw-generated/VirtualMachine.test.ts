import { VirtualMachine } from './VirtualMachine';

describe('VirtualMachine', () => {
  let vm: VirtualMachine;

  beforeEach(() => {
    vm = new VirtualMachine();
  });

  it('should execute ADD instruction', () => {
    const bytecode = new Uint8Array([0x01, 0x02, 0x01]);
    vm.execute(bytecode);
    expect(vm.stack).toEqual([3]);
  });

  it('should execute MUL instruction', () => {
    const bytecode = new Uint8Array([0x02, 0x03, 0x02]);
    vm.execute(bytecode);
    expect(vm.stack).toEqual([6]);
  });

  it('should execute PUSH and POP instructions', () => {
    const bytecode = new Uint8Array([0x03, 0x42, 0x04]);
    vm.execute(bytecode);
    expect(vm.stack).toEqual([]);
  });

  it('should execute LOAD and STORE instructions', () => {
    const bytecode = new Uint8Array([0x03, 0x42, 0x06, 0x00, 0x03, 0x00, 0x05, 0x00]);
    vm.execute(bytecode);
    expect(vm.stack).toEqual([0x42]);
    expect(vm.memory[0]).toBe(0x42);
  });
});
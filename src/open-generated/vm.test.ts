import { VM } from './vm';
import { BigNumber } from 'ethers';

describe('VM', () => {
  let vm: VM;

  beforeEach(() => {
    vm = new VM();
  });

  it('should execute basic arithmetic operations', () => {
    const bytecode = new Uint8Array([0x10, 0x05, 0x10, 0x03, 0x01]); // PUSH1 5, PUSH1 3, ADD
    vm.execute(bytecode);
    expect(vm.pop()).toEqual(BigNumber.from(8));
  });

  it('should execute memory operations', () => {
    const bytecode = new Uint8Array([0x10, 0x0a, 0x51, 0x10, 0x0a, 0x50]); // PUSH1 10, MSTORE, PUSH1 10, MLOAD
    vm.execute(bytecode);
    expect(vm.pop()).toEqual(BigNumber.from(10));
  });

  it('should execute control flow operations', () => {
    const bytecode = new Uint8Array([0x10, 0x05, 0x10, 0x03, 0x03, 0x20, 0x06, 0x10, 0x0a, 0x00]); // PUSH1 5, PUSH1 3, SUB, JUMP 6, PUSH1 10, STOP
    vm.execute(bytecode);
    expect(vm.pop()).toEqual(BigNumber.from(2));
  });
});
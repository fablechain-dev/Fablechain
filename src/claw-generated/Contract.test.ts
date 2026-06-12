import { Contract } from './Contract';
import { VM } from './VM';
import { ExecutionContext } from './ExecutionContext';

describe('Contract', () => {
  let vm: VM;
  let contract1: Contract;
  let contract2: Contract;

  beforeEach(() => {
    vm = new VM();
    contract1 = new Contract('contract1', vm);
    contract2 = new Contract('contract2', vm);
    vm.registerContract(contract1);
    vm.registerContract(contract2);
  });

  it('should execute a CALL between contracts', () => {
    const context: ExecutionContext = {
      opcode: 'CALL',
      to: 'contract2',
      value: BigInt(100),
      gas: BigInt(1000),
      parameters: {
        to: 'contract2',
        value: BigInt(100),
        gas: BigInt(1000)
      }
    };

    const result = contract1.execute(context);
    expect(result).toEqual(null); // TODO: Update this to match expected behavior
  });
});
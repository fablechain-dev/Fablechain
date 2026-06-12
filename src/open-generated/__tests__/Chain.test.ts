import { Block } from '../Block';
import { Chain } from '../Chain';

describe('Chain', () => {
  let chain: Chain;

  beforeEach(() => {
    chain = new Chain();
  });

  test('should add a new block', () => {
    chain.addBlock({ data: 'test' });
    expect(chain.blocks.length).toBe(1);
  });

  test('should validate a correct chain', () => {
    chain.addBlock({ data: 'block 1' });
    chain.addBlock({ data: 'block 2' });
    expect(chain.isValid()).toBe(true);
  });

  test('should replace a shorter chain with a longer one', () => {
    chain.addBlock({ data: 'block 1' });
    chain.addBlock({ data: 'block 2' });

    const newChain = new Chain();
    newChain.addBlock({ data: 'block 1' });
    newChain.addBlock({ data: 'block 2' });
    newChain.addBlock({ data: 'block 3' });

    expect(chain.replaceChain(newChain.blocks)).toBe(true);
    expect(chain.blocks.length).toBe(3);
  });

  test('should not replace a longer chain with a shorter one', () => {
    chain.addBlock({ data: 'block 1' });
    chain.addBlock({ data: 'block 2' });
    chain.addBlock({ data: 'block 3' });

    const newChain = new Chain();
    newChain.addBlock({ data: 'block 1' });
    newChain.addBlock({ data: 'block 2' });

    expect(chain.replaceChain(newChain.blocks)).toBe(false);
    expect(chain.blocks.length).toBe(3);
  });

  test('should handle chain forks and select the valid chain', () => {
    chain.addBlock({ data: 'block 1' });
    chain.addBlock({ data: 'block 2' });

    const fork1 = new Chain();
    fork1.addBlock({ data: 'block 1' });
    fork1.addBlock({ data: 'block 2' });
    fork1.addBlock({ data: 'block 3' });

    const fork2 = new Chain();
    fork2.addBlock({ data: 'block 1' });
    fork2.addBlock({ data: 'block 2' });
    fork2.addBlock({ data: 'block 3' });
    fork2.addBlock({ data: 'block 4' });

    expect(chain.replaceChain(fork1.blocks)).toBe(true);
    expect(chain.blocks.length).toBe(3);

    expect(chain.replaceChain(fork2.blocks)).toBe(true);
    expect(chain.blocks.length).toBe(4);
  });

  test('should prevent double-spend attacks', () => {
    chain.addBlock({ data: 'block 1', balance: 100 });
    chain.addBlock({ data: 'block 2', balance: 50 });

    const fork = new Chain();
    fork.addBlock({ data: 'block 1', balance: 100 });
    fork.addBlock({ data: 'block 2', balance: 75 }); // Trying to double-spend

    expect(chain.replaceChain(fork.blocks)).toBe(false);
    expect(chain.blocks.length).toBe(2);
  });
});
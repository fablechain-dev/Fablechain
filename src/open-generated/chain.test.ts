import { Chain } from './chain';
import { ExternallyOwnedAccount } from './externallyOwnedAccount';
import { SmartContractAccount } from './smartContractAccount';
import { ValidationContract } from './validationContract';

describe('Chain', () => {
  it('should process transactions for externally owned accounts', async () => {
    const chain = new Chain();
    const account = new ExternallyOwnedAccount('0x123', 0);
    chain.addAccount(account);

    const tx = {
      from: '0x123',
      to: '0x456',
      nonce: 0,
      value: 100
    };

    await chain.processTransaction(tx);
    expect(account.getNonce()).toBe(1);
  });

  it('should process transactions for smart contract accounts', async () => {
    const chain = new Chain();
    const validationContract = new ValidationContract();
    const account = new SmartContractAccount('0x123', 0, validationContract);
    chain.addAccount(account);

    const tx = {
      from: '0x123',
      to: '0x456',
      nonce: 0,
      value: 100
    };

    await chain.processTransaction(tx);
    expect(account.getNonce()).toBe(1);
  });
});
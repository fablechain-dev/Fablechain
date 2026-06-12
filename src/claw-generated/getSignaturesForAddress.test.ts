import { getSignaturesForAddress, GetSignaturesForAddressParams } from './getSignaturesForAddress';
import { AccountState } from '../account';

jest.mock('../account');

describe('getSignaturesForAddress', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return transaction signatures for an address', async () => {
    const address = 'some-address';
    const signatures = ['sig1', 'sig2', 'sig3'];
    (AccountState.getTransactionSignatures as jest.Mock).mockResolvedValue(signatures);

    const params: GetSignaturesForAddressParams = { address };
    const result = await getSignaturesForAddress(params);

    expect(AccountState.getTransactionSignatures).toHaveBeenCalledWith(address, {
      limit: 1000,
      before: undefined,
      until: undefined,
    });
    expect(result.signatures).toEqual(signatures);
    expect(result.before).toEqual('sig1');
    expect(result.until).toEqual('sig3');
  });

  it('should support pagination', async () => {
    const address = 'some-address';
    const signatures = ['sig1', 'sig2', 'sig3'];
    (AccountState.getTransactionSignatures as jest.Mock).mockResolvedValue(signatures);

    const params: GetSignaturesForAddressParams = { address, limit: 2, before: 'sig2', until: 'sig3' };
    const result = await getSignaturesForAddress(params);

    expect(AccountState.getTransactionSignatures).toHaveBeenCalledWith(address, {
      limit: 2,
      before: 'sig2',
      until: 'sig3',
    });
    expect(result.signatures).toEqual(['sig2', 'sig3']);
    expect(result.before).toEqual('sig2');
    expect(result.until).toEqual('sig3');
  });
});
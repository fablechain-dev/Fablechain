import { getSignaturesForAddress } from '../getSignaturesForAddress';
import { getTransactionSignaturesForAddress } from '../getTransactionSignaturesForAddress';
import { Connection, PublicKey } from '@solana/web3.js';

jest.mock('../getTransactionSignaturesForAddress');

describe('getSignaturesForAddress', () => {
  const mockConnection = new Connection('https://api.example.com');

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return signatures and pagination info', async () => {
    (getTransactionSignaturesForAddress as jest.Mock).mockResolvedValue([
      { signature: 'sig1' },
      { signature: 'sig2' },
      { signature: 'sig3' },
    ]);

    const result = await getSignaturesForAddress({
      address: 'address1',
      limit: 2,
      before: 'sig2',
      until: 'sig3',
    });

    expect(result).toEqual({
      signatures: ['sig1', 'sig2'],
      before: 'sig1',
      until: 'sig3',
    });

    expect(getTransactionSignaturesForAddress).toHaveBeenCalledWith(
      mockConnection,
      new PublicKey('address1'),
      { limit: 2, before: 'sig2', until: 'sig3' }
    );
  });
});
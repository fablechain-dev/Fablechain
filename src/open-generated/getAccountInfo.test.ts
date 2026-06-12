import { Connection, PublicKey, AccountInfo as SolanaAccountInfo } from '@solana/web3.js';
import { getAccountInfo, AccountInfo } from './getAccountInfo';
import { mock, mockReset } from 'jest-mock-extended';

describe('getAccountInfo', () => {
  let connection: Connection;

  beforeEach(() => {
    connection = mock<Connection>();
  });

  afterEach(() => {
    mockReset(connection);
  });

  it('should return account info', async () => {
    const pubkey = 'B1ockchainDevelopmentIsAwesome';
    const accountInfo: SolanaAccountInfo = {
      lamports: 100,
      owner: new PublicKey('OwnerPublicKey'),
      executable: true,
      rentEpoch: 0
    };

    jest.spyOn(connection, 'getAccountInfo').mockResolvedValue(accountInfo);

    const result = await getAccountInfo(connection, pubkey);

    expect(connection.getAccountInfo).toHaveBeenCalledWith(new PublicKey(pubkey));
    expect(result).toEqual({
      lamports: 100,
      owner: 'OwnerPublicKey',
      executable: true
    });
  });

  it('should throw error if account not found', async () => {
    const pubkey = 'NonexistentAccount';

    jest.spyOn(connection, 'getAccountInfo').mockResolvedValue(null);

    await expect(getAccountInfo(connection, pubkey)).rejects.toThrow(`Account not found for pubkey: ${pubkey}`);
  });
});
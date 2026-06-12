import { getSignaturesForAddress } from './account';

describe('getSignaturesForAddress', () => {
  it('should fetch transaction signatures for the given address', async () => {
    const signatures = await getSignaturesForAddress('0x123456789');
    expect(signatures.length).toBeGreaterThan(0);
    expect(signatures).toContain('signature1');
  });

  it('should support pagination', async () => {
    const firstPage = await getSignaturesForAddress('0x123456789', 2, 0);
    expect(firstPage.length).toBe(2);

    const secondPage = await getSignaturesForAddress('0x123456789', 2, 2);
    expect(secondPage.length).toBe(1);
  });
});
import { providers } from 'ethers';

export class BlockUtils {
  private static provider: providers.Provider;

  static setProvider(provider: providers.Provider) {
    BlockUtils.provider = provider;
  }

  static async getCurrentBlockNumber(): Promise<number> {
    if (!BlockUtils.provider) {
      throw new Error('Provider not set');
    }
    const block = await BlockUtils.provider.getBlock('latest');
    return block.number;
  }
}
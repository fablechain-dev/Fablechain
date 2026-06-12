import { getAccountInfo, simulateTransaction } from '../account';
import { getBlock } from '../block';
import { getSignaturesForAddress } from '../account';

export const getRpcMethods = () => {
  return {
    getAccountInfo,
    simulateTransaction,
    getBlock,
    getSignaturesForAddress
  };
};
import { Transaction } from '../transaction';
import { AccountState } from '../account';

export interface GetSignaturesForAddressParams {
  address: string;
  limit?: number;
  before?: string;
  until?: string;
}

export interface GetSignaturesForAddressResult {
  signatures: string[];
  before: string;
  until: string;
}

export async function getSignaturesForAddress(
  params: GetSignaturesForAddressParams
): Promise<GetSignaturesForAddressResult> {
  const { address, limit = 1000, before, until } = params;

  // Fetch transaction signatures for the given address
  const signatures = await AccountState.getTransactionSignatures(address, {
    limit,
    before,
    until,
  });

  return {
    signatures,
    before: signatures.length > 0 ? signatures[0] : '',
    until: signatures.length > 0 ? signatures[signatures.length - 1] : '',
  };
}
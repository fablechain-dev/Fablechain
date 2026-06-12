import { getAccountInfo as getAccountInfoImpl, getBalance as getBalanceImpl, getSignaturesForAddress as getSignaturesForAddressImpl, getTransaction as getTransactionImpl, getTransactionReceipt as getTransactionReceiptImpl } from '../../rpc/account';

export async function getAccountInfo(params: { pubkey: string }): Promise<any> {
  const { pubkey } = params;
  return await getAccountInfoImpl(pubkey);
}

export async function getBalance(params: { pubkey: string }): Promise<any> {
  const { pubkey } = params;
  return await getBalanceImpl(pubkey);
}

export async function getSignaturesForAddress(params: { pubkey: string, limit?: number, before?: string, until?: string }): Promise<any> {
  const { pubkey, limit, before, until } = params;
  return await getSignaturesForAddressImpl(pubkey, limit, before, until);
}

export async function getTransaction(params: { signature: string }): Promise<any> {
  const { signature } = params;
  return await getTransactionImpl(signature);
}

export async function getTransactionReceipt(params: { signature: string }): Promise<any> {
  const { signature } = params;
  return await getTransactionReceiptImpl(signature);
}
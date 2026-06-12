import TransportWebHID from '@ledgerhq/hw-transport-webhid';
import Eth from '@ledgerhq/hw-app-eth';
import { KeyPair } from '../keypair';

export async function getLedgerKeyPair(): Promise<KeyPair> {
  const transport = await TransportWebHID.create();
  const eth = new Eth(transport);
  const { address, publicKey } = await eth.getAddress("44'/60'/0'/0/0");
  return { publicKey, privateKey: '' };
}

export async function signLedgerTransaction(transaction: any, path: string): Promise<string> {
  const transport = await TransportWebHID.create();
  const eth = new Eth(transport);
  const signature = await eth.signTransaction(path, transaction);
  return signature.toString('hex');
}
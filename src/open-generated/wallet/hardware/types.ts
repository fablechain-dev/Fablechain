export interface TransportInterface {
  name: string;
  signTransaction(transaction: any): Promise<any>;
}
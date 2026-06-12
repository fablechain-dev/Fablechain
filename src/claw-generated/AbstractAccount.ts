export interface AbstractAccount {
  address: string;
  validate(tx: Transaction): boolean;
}
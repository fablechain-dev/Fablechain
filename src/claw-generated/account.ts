export interface Account {
  getAddress(): string;
  getNonce(): number;
  validateTransaction(tx: Transaction): boolean;
  execute(tx: Transaction): Promise&lt;void&gt;;
}
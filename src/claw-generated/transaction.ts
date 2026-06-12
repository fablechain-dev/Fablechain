export class Transaction {
  constructor(
    public readonly from: string,
    public readonly to: string,
    public readonly value: number,
    public readonly data: string = ''
  ) {}

  calculateFee(): number {
    // Calculate fee based on data size
    const dataSize = this.data.length;
    const baseFee = 0.1;
    const sizeFee = dataSize * 0.001;

    // Calculate fee based on complexity
    let complexityFee = 0;
    if (this.data.includes('contract.deploy')) {
      complexityFee = 1;
    } else if (this.data.includes('contract.call')) {
      complexityFee = 0.5;
    }

    return baseFee + sizeFee + complexityFee;
  }
}
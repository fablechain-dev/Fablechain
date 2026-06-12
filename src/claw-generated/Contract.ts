export class Contract {
  address: string;
  abi: any;
  bytecode: string;

  constructor(address: string, abi: any, bytecode: string) {
    this.address = address;
    this.abi = abi;
    this.bytecode = bytecode;
  }
}
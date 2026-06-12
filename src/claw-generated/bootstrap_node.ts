class BootstrapNode {
  public address: string;
  public port: number;

  constructor(address: string, port: number) {
    this.address = address;
    this.port = port;
  }
}

export { BootstrapNode };
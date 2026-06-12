export class Peer {
  id: string;
  address: string;
  port: number;

  constructor(id: string, address: string, port: number) {
    this.id = id;
    this.address = address;
    this.port = port;
  }

  disconnect() {
    // Implement peer disconnection logic
  }
}
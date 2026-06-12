import { KademliaDHT } from './dht';
import { Node } from './types';

describe('KademliaDHT', () => {
  it('should join the network and find nodes', async () => {
    const bootstrapNodes: Node[] = [
      { id: 'node1', address: '127.0.0.1', port: 3000 },
      { id: 'node2', address: '127.0.0.1', port: 3001 },
      { id: 'node3', address: '127.0.0.1', port: 3002 }
    ];

    const dht = new KademliaDHT(bootstrapNodes);
    await dht.joinNetwork();

    const targetNodeId = 'someNodeId';
    const foundNodes = await dht.findNode(targetNodeId);
    expect(foundNodes.length).toBeGreaterThanOrEqual(3);
  });

  it('should store and retrieve key-value pairs', async () => {
    const bootstrapNodes: Node[] = [
      { id: 'node1', address: '127.0.0.1', port: 3000 },
      { id: 'node2', address: '127.0.0.1', port: 3001 },
      { id: 'node3', address: '127.0.0.1', port: 3002 }
    ];

    const dht = new KademliaDHT(bootstrapNodes);
    await dht.joinNetwork();

    const key = 'myKey';
    const value = { data: 'some value' };
    await dht.store(key, value);

    const retrievedValue = await dht.retrieve(key);
    expect(retrievedValue).toEqual(value);
  });
});
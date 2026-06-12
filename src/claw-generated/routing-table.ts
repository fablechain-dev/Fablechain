import { Node } from './types';

class RoutingTable {
  buckets: Node[][];

  constructor() {
    this.buckets = [];
    for (let i = 0; i < 160; i++) {
      this.buckets.push([]);
    }
  }

  addNode(node: Node) {
    // Find the appropriate bucket for the node
    const bucketIndex = this.getBucketIndex(node.id);
    const bucket = this.buckets[bucketIndex];

    // If the bucket is not full, add the node
    if (bucket.length < 16) {
      bucket.push(node);
      return;
    }

    // If the bucket is full, evict the least recently used node
    const leastRecentNode = bucket[0];
    bucket.shift();
    bucket.push(node);

    // Update the least recent node's last seen time
    leastRecentNode.lastSeen = Date.now();
  }

  findClosestNodes(key: string): Node[] {
    // Find the bucket that contains the nodes closest to the key
    const bucketIndex = this.getBucketIndex(key);
    const bucket = this.buckets[bucketIndex];

    // Sort the nodes in the bucket by distance to the key
    const sortedNodes = bucket.slice().sort((a, b) => this.distance(a.id, key) - this.distance(b.id, key));

    // Return the closest nodes
    return sortedNodes.slice(0, 8);
  }

  private getBucketIndex(key: string): number {
    // Calculate the bucket index based on the key
    let distance = 0;
    for (let i = 0; i < key.length; i++) {
      if (key[i] !== '0') {
        distance = i;
        break;
      }
    }
    return distance;
  }

  private distance(a: string, b: string): number {
    // Calculate the distance between two keys
    let distance = 0;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) {
        distance = i;
        break;
      }
    }
    return distance;
  }
}

export default RoutingTable;
import { NodeId, Node } from './node';

class RoutingTable {
  private kBuckets: Map<number, Node[]>;
  private k: number = 20; // Bucket size parameter

  constructor(public localNodeId: NodeId) {
    this.kBuckets = new Map();
  }

  addNode(node: Node) {
    const distance = this.distance(this.localNodeId, node.id);
    let bucket = this.kBuckets.get(distance);
    if (!bucket) {
      bucket = [];
      this.kBuckets.set(distance, bucket);
    }

    this.addToKBucket(bucket, node);
  }

  removeNode(node: Node) {
    const distance = this.distance(this.localNodeId, node.id);
    const bucket = this.kBuckets.get(distance);
    if (bucket) {
      this.kBuckets.set(distance, bucket.filter(n => !n.equals(node)));
    }
  }

  private addToKBucket(bucket: Node[], node: Node) {
    // If the bucket contains the node, update its position
    const existingIndex = bucket.findIndex(n => n.equals(node));
    if (existingIndex !== -1) {
      bucket.splice(existingIndex, 1);
      bucket.unshift(node);
      return;
    }

    // If the bucket is not full, add the node
    if (bucket.length < this.k) {
      bucket.unshift(node);
      return;
    }

    // If the bucket is full, replace the least recently used node
    bucket.pop();
    bucket.unshift(node);
  }

  private distance(id1: NodeId, id2: NodeId): number {
    // Calculate the XOR distance between two node IDs
    return id1 ^ id2;
  }
}

export { RoutingTable };
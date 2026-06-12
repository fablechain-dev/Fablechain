import { blockProduced } from '../monitoring/metrics';

export class BlockProducer {
  // ... existing code ...

  async produceBlock() {
    // ... existing block production logic ...
    blockProduced.inc();
  }
}
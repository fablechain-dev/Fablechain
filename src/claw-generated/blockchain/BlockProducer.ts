import { blockProducedCounter, blockProductionLatencyGauge } from '../metrics';

class BlockProducer {
  // ... other methods

  async produceBlock() {
    const startTime = Date.now();
    // ... block production logic

    blockProducedCounter.inc();
    blockProductionLatencyGauge.set(Date.now() - startTime);
  }
}

export default BlockProducer;
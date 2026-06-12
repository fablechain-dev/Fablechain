// transaction.ts

import { EventEmitter, EventReceipt } from './events';

export class Transaction {
  private eventEmitter = new EventEmitter();

  execute() {
    // Execute the transaction logic
    // ...

    // Capture any emitted events
    const events = this.eventEmitter.getEvents();
    this.eventEmitter.clearEvents();

    // Create the transaction receipt
    return new TransactionReceipt(
      this.hash,
      events
    );
  }

  emit(name: string, data: any) {
    this.eventEmitter.emit(name, data);
  }
}

export class TransactionReceipt {
  constructor(
    public transactionHash: string,
    public events: EventData[]
  ) {}

  getBloomFilter(): number[] {
    return new EventReceipt(this.transactionHash, this.events).getBloomFilter();
  }
}
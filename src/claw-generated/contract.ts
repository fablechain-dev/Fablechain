import { EventEmitter } from './events';

export class Contract {
  private eventEmitter: EventEmitter;

  constructor() {
    this.eventEmitter = new EventEmitter();
  }

  emit(name: string, indexedParams: any[], unindexedParams: any[]) {
    this.eventEmitter.emit(this.address, name, indexedParams, unindexedParams);
  }

  // Other contract methods...
}
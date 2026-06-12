import { ByteArray, Hex } from './types';

export class Event {
  name: string;
  parameters: { [key: string]: any };

  constructor(name: string, parameters: { [key: string]: any }) {
    this.name = name;
    this.parameters = parameters;
  }

  toJSON(): { name: string; parameters: { [key: string]: any } } {
    return {
      name: this.name,
      parameters: this.parameters,
    };
  }

  static fromJSON(json: { name: string; parameters: { [key: string]: any } }): Event {
    return new Event(json.name, json.parameters);
  }
}

export class EventLog {
  events: Event[];
  address: ByteArray;
  transactionHash: Hex;
  blockNumber: number;
  logIndex: number;

  constructor(
    events: Event[],
    address: ByteArray,
    transactionHash: Hex,
    blockNumber: number,
    logIndex: number
  ) {
    this.events = events;
    this.address = address;
    this.transactionHash = transactionHash;
    this.blockNumber = blockNumber;
    this.logIndex = logIndex;
  }

  toJSON(): {
    events: { name: string; parameters: { [key: string]: any } }[];
    address: ByteArray;
    transactionHash: Hex;
    blockNumber: number;
    logIndex: number;
  } {
    return {
      events: this.events.map((event) => event.toJSON()),
      address: this.address,
      transactionHash: this.transactionHash,
      blockNumber: this.blockNumber,
      logIndex: this.logIndex,
    };
  }

  static fromJSON(json: {
    events: { name: string; parameters: { [key: string]: any } }[];
    address: ByteArray;
    transactionHash: Hex;
    blockNumber: number;
    logIndex: number;
  }): EventLog {
    return new EventLog(
      json.events.map(Event.fromJSON),
      json.address,
      json.transactionHash,
      json.blockNumber,
      json.logIndex
    );
  }
}
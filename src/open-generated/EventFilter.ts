import { Event } from './Event';
import { EventLog } from './EventLog';

export class EventFilter {
  private eventLog: EventLog;

  constructor(eventLog: EventLog) {
    this.eventLog = eventLog;
  }

  filterEvents(eventName?: string): Event[] {
    if (eventName) {
      return this.eventLog.getEvents().filter(event => event.name === eventName);
    } else {
      return this.eventLog.getEvents();
    }
  }
}
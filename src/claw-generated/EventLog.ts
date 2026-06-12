import { Event } from './Event';

export class EventLog {
  private events: Event[] = [];

  addEvent(event: Event): void {
    this.events.push(event);
  }

  getEvents(): Event[] {
    return this.events;
  }
}
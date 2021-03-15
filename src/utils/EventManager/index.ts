import EventEmitter from './EventEmitter';

export type EventData<E> = E extends EventEmitter<infer R> ? R : never;

export default class EventManager<
  E extends { [x: string]: EventEmitter<any> }
> {
  private events: E;

  constructor(events: E) {
    this.events = events;
  }

  public on<T extends keyof E>(
    type: T,
    handler: (ev: EventData<E[T]>) => void,
  ) {
    this.events[type].on(handler);
  }

  public once<T extends keyof E>(
    type: T,
    handler: (ev: EventData<E[T]>) => void,
  ) {
    this.events[type].once(handler);
  }

  public off<T extends keyof E>(
    type: T,
    handler: (ev: EventData<E[T]>) => void,
  ) {
    this.events[type].off(handler);
  }

  public clear<T extends keyof E>(type: T) {
    this.events[type].clear();
  }

  public emit<T extends keyof E>(type: T, ev: EventData<E[T]>) {
    this.events[type].emit(ev);
  }
}

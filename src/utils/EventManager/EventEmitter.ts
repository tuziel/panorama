export default class EventEmitter<E> {
  private handlers: Array<(ev: E) => void> = [];

  public on(handler: (ev: E) => void) {
    if (this.handlers.indexOf(handler) < 0) {
      this.handlers.push(handler);
    }
  }

  public once(handler: (ev: E) => void) {
    const fn = (ev: E) => {
      handler(ev);
      this.off(fn);
    };
    this.on(fn);
  }

  public off(handler: (ev: E) => void) {
    const index = this.handlers.indexOf(handler);
    if (index > -1) this.handlers.splice(index, 1);
  }

  public clear() {
    this.handlers.length = 0;
  }

  public emit(ev: E) {
    [...this.handlers].forEach((handler) => handler.call(window, ev));
  }
}

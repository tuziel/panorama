import EventManager, { EventData } from '../../utils/EventManager';
import EventEmitter from '../../utils/EventManager/EventEmitter';

export interface DrDragEvent {
  /** 拖拽的距离 x */
  x: number;
  /** 拖拽的距离 y */
  y: number;
  /** 与上一次事件的差距 x */
  deltaX: number;
  /** 与上一次事件的差距 y */
  deltaY: number;
}

export interface DrScaleEvent {
  /** 缩放值 */
  scale: number;
  /** 与上一次事件的差距 */
  deltaScale: number;
}

export interface DrWheelEvent {
  delta: number;
}

export interface DrEventMap {
  dragStart: void;
  drag: DrDragEvent;
  dragEnd: void;
  scale: DrScaleEvent;
  wheel: DrWheelEvent;
}

type Events = {
  [K in keyof DrEventMap]: EventEmitter<DrEventMap[K]>;
};

export default class Dragger {
  private target;

  private events = new EventManager({
    dragStart: new EventEmitter<void>(),
    drag: new EventEmitter<DrDragEvent>(),
    dragEnd: new EventEmitter<void>(),
    scale: new EventEmitter<DrScaleEvent>(),
    wheel: new EventEmitter<DrWheelEvent>(),
  } as Events);

  private firstX = 0;
  private firstY = 0;
  private lastX = 0;
  private lastY = 0;

  constructor(target: HTMLElement) {
    this.target = target;

    this.init();
  }

  public on<K extends keyof Events>(
    type: K,
    listener: (ev: EventData<Events[K]>) => void,
  ) {
    this.events.on(type, listener);
  }

  public off<K extends keyof Events>(
    type: K,
    listener: (ev: EventData<Events[K]>) => void,
  ) {
    this.events.off(type, listener);
  }

  public destory() {
    const target = this.target;
    target.removeEventListener('touchstart', this.ontouchstart);
    target.removeEventListener('touchmove', this.ontouchmove);
    target.removeEventListener('touchend', this.ontouchend);
    target.removeEventListener('touchcancel', this.ontouchend);
    target.removeEventListener('mousedown', this.onmousedown);
    window.removeEventListener('mousemove', this.onmousemove, true);
    window.removeEventListener('mouseup', this.onmouseup, true);
    window.removeEventListener('blur', this.onmouseup, false);
    target.removeEventListener('wheel', this.onwheel);
  }

  private init() {
    const target = this.target;

    this.ontouchstart = this.ontouchstart.bind(this);
    this.ontouchmove = this.ontouchmove.bind(this);
    this.ontouchend = this.ontouchend.bind(this);
    this.ontouchend = this.ontouchend.bind(this);
    this.onmousedown = this.onmousedown.bind(this);
    this.onmousemove = this.onmousemove.bind(this);
    this.onmouseup = this.onmouseup.bind(this);
    this.onmouseup = this.onmouseup.bind(this);
    this.onwheel = this.onwheel.bind(this);

    target.addEventListener('touchstart', this.ontouchstart);
    target.addEventListener('mousedown', this.onmousedown);
    target.addEventListener('wheel', this.onwheel);
  }

  private drag(clientX: number, clientY: number) {
    this.events.emit('drag', {
      x: clientX - this.firstX,
      y: clientY - this.firstY,
      deltaX: clientX - this.lastX,
      deltaY: clientY - this.lastY,
    });

    this.lastX = clientX;
    this.lastY = clientY;
  }

  private ontouchstart(ev: TouchEvent) {
    const target = this.target;
    target.removeEventListener('touchstart', this.ontouchstart);
    target.addEventListener('touchmove', this.ontouchmove);
    target.addEventListener('touchend', this.ontouchend);
    target.addEventListener('touchcancel', this.ontouchend);

    // TODO: 未实现 scale
    const touches = ev.touches;
    this.firstX = this.lastX = touches[0].clientX;
    this.firstY = this.lastY = touches[0].clientY;

    this.events.emit('dragStart', undefined);
  }

  private ontouchmove(ev: TouchEvent) {
    const touches = ev.touches;
    const { clientX, clientY } = touches[0];
    this.drag(clientX, clientY);
  }

  private ontouchend() {
    const target = this.target;
    target.addEventListener('touchstart', this.ontouchstart);
    target.removeEventListener('touchmove', this.ontouchmove);
    target.removeEventListener('touchend', this.ontouchend);
    target.removeEventListener('touchcancel', this.ontouchend);

    this.events.emit('dragEnd', undefined);
  }

  private onscale() {
    // TODO: 此处应有缩放
  }

  private onmousedown(ev: MouseEvent) {
    if (ev.button !== 0) return;

    const target = this.target;
    target.removeEventListener('mousedown', this.onmousedown);
    window.addEventListener('mousemove', this.onmousemove, true);
    window.addEventListener('mouseup', this.onmouseup, true);
    window.addEventListener('blur', this.onmouseup, false);

    this.firstX = this.lastX = ev.clientX;
    this.firstY = this.lastY = ev.clientY;

    this.events.emit('dragStart', undefined);
  }

  private onmousemove(ev: MouseEvent) {
    this.drag(ev.clientX, ev.clientY);
  }

  private onmouseup() {
    const target = this.target;
    target.addEventListener('mousedown', this.onmousedown);
    window.removeEventListener('mousemove', this.onmousemove, true);
    window.removeEventListener('mouseup', this.onmouseup, true);
    window.removeEventListener('blur', this.onmouseup, false);

    this.events.emit('dragEnd', undefined);
  }

  private onwheel(ev: WheelEvent) {
    this.events.emit('wheel', { delta: ev.deltaY });
  }
}

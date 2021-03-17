import EventManager, { EventData } from '../../utils/EventManager';
import EventEmitter from '../../utils/EventManager/EventEmitter';

/** 最少采样次数 */
const MIN_SAMPLING_LENGTH = 4;
/** 最大采样次数 */
const MAX_SAMPLING_LENGTH = 10;
/** 最大采样时间 */
const MAX_SAMPLING_TIME = 30;
/** 摩擦力 */
const FRICTION = 0.025;

export interface SenceDragStartEvent {
  x: number;
  y: number;
}

export interface SenceDragEvent {
  /** 拖拽的距离 x */
  offsetX: number;
  /** 拖拽的距离 y */
  offsetY: number;
  /** 与上一次事件的差距 x */
  deltaX: number;
  /** 与上一次事件的差距 y */
  deltaY: number;
}

export interface SenceDragEndEvent {
  /** x 轴速度 单位为 `px / ms` */
  velocityX: number;
  /** y 轴速度 单位为 `px / ms` */
  velocityY: number;
}

export interface SenceDragInertiaEvent {
  /** 与上一次事件的差距 x */
  deltaX: number;
  /** 与上一次事件的差距 y */
  deltaY: number;
}

export interface SenceWheelEvent {
  delta: number;
}

export interface SenceScaleEvent {
  /** 缩放值 */
  scale: number;
  /** 与上一次事件的差距 */
  deltaScale: number;
}

export interface EventMap {
  dragStart: SenceDragStartEvent;
  drag: SenceDragEvent;
  dragEnd: SenceDragEndEvent;
  dragInertia: SenceDragInertiaEvent;
  scale: SenceScaleEvent;
  wheel: SenceWheelEvent;
}

type Events = {
  [K in keyof EventMap]: EventEmitter<EventMap[K]>;
};

export default class Control {
  private target;

  private startX = 0;
  private startY = 0;

  private rafId = -1;

  private events = new EventManager({
    dragStart: new EventEmitter<SenceDragStartEvent>(),
    drag: new EventEmitter<SenceDragEvent>(),
    dragEnd: new EventEmitter<SenceDragEndEvent>(),
    dragInertia: new EventEmitter<SenceDragInertiaEvent>(),
    scale: new EventEmitter<SenceScaleEvent>(),
    wheel: new EventEmitter<SenceWheelEvent>(),
  } as Events);

  /** [x, y, time] */
  private path: [number, number, number][] = [];

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
    window.removeEventListener('blur', this.onblur, false);
    target.removeEventListener('wheel', this.onwheel);
    cancelAnimationFrame(this.rafId);
  }

  private init() {
    const target = this.target;
    target.addEventListener('touchstart', this.ontouchstart);
    target.addEventListener('mousedown', this.onmousedown);
    target.addEventListener('wheel', this.onwheel);
  }

  private dragStart(x: number, y: number, time: number) {
    this.startX = x;
    this.startY = y;
    this.path = [[x, y, time]];

    cancelAnimationFrame(this.rafId);

    this.events.emit('dragStart', { x, y });
  }

  private drag(x: number, y: number, time: number) {
    const { path } = this;
    const [lastX, lasyY] = path[path.length - 1];

    if (path.length >= MAX_SAMPLING_LENGTH) path.shift();
    path.push([x, y, time]);

    this.events.emit('drag', {
      offsetX: x - this.startX,
      offsetY: y - this.startY,
      deltaX: x - lastX,
      deltaY: y - lasyY,
    });
  }

  private dragEnd() {
    const { path } = this;
    let vx = 0;
    let vy = 0;

    if (path.length >= MIN_SAMPLING_LENGTH) {
      let [lastX, lastY, lastTime] = path.pop()!;
      let [x, y, t, dt] = [0, 0, 0, 0];

      while (path.length) {
        [x, y, t] = path.pop()!;
        dt = lastTime - t;
        if (dt < MAX_SAMPLING_TIME) {
          vx = (lastX - x) / dt;
          vy = (lastY - y) / dt;
        }
      }
    }

    if (vx !== 0) this.inertia(vx, vy, performance.now());
    this.events.emit('dragEnd', { velocityX: vx, velocityY: vy });
  }

  private inertia(vx: number, vy: number, lastTime: number) {
    cancelAnimationFrame(this.rafId);
    this.rafId = requestAnimationFrame((time) => {
      const dt = time - lastTime;
      let deltaX = 0;
      let deltaY = 0;

      const theta = Math.atan2(vy, vx);
      const v = Math.max(0, Math.sqrt(vx * vx + vy * vy) - FRICTION * dt);

      const vx2 = Math.cos(theta) * v;
      const vy2 = Math.sin(theta) * v;
      deltaX = ((vx + vx2) / 2) * dt;
      deltaY = ((vy + vy2) / 2) * dt;
      if (v > 0) this.inertia(vx2, vy2, time);

      this.events.emit('dragInertia', { deltaX, deltaY });
    });
  }

  private ontouchstart = (ev: TouchEvent) => {
    const { clientX, clientY } = ev.touches[0];
    this.dragStart(clientX, clientY, performance.now());

    // TODO: 未实现 scale

    const target = this.target;
    target.removeEventListener('touchstart', this.ontouchstart);
    target.addEventListener('touchmove', this.ontouchmove);
    target.addEventListener('touchend', this.ontouchend);
    target.addEventListener('touchcancel', this.ontouchend);
  };

  private ontouchmove = (ev: TouchEvent) => {
    const { clientX, clientY } = ev.touches[0];
    this.drag(clientX, clientY, performance.now());
  };

  private ontouchend = () => {
    const dt = performance.now() - this.path[this.path.length - 1][2];
    if (dt <= MAX_SAMPLING_TIME) this.dragEnd();

    const target = this.target;
    target.addEventListener('touchstart', this.ontouchstart);
    target.removeEventListener('touchmove', this.ontouchmove);
    target.removeEventListener('touchend', this.ontouchend);
    target.removeEventListener('touchcancel', this.ontouchend);
  };

  private onscale() {
    // TODO: 此处应有缩放
  }

  private onmousedown = (ev: MouseEvent) => {
    if (ev.button !== 0) return;

    const { clientX, clientY } = ev;
    this.dragStart(clientX, clientY, performance.now());

    const target = this.target;
    target.removeEventListener('mousedown', this.onmousedown);
    window.addEventListener('mousemove', this.onmousemove, true);
    window.addEventListener('mouseup', this.onmouseup, true);
    window.addEventListener('blur', this.onblur, false);
  };

  private onmousemove = (ev: MouseEvent) => {
    this.drag(ev.clientX, ev.clientY, performance.now());
  };

  private onmouseup = (ev: MouseEvent) => {
    this.onmousemove(ev);
    this.dragEnd();

    const target = this.target;
    target.addEventListener('mousedown', this.onmousedown);
    window.removeEventListener('mousemove', this.onmousemove, true);
    window.removeEventListener('mouseup', this.onmouseup, true);
    window.removeEventListener('blur', this.onblur, false);
  };

  private onblur = () => {
    this.dragEnd();
  };

  private onwheel = (ev: WheelEvent) => {
    this.events.emit('wheel', { delta: ev.deltaY });
  };
}

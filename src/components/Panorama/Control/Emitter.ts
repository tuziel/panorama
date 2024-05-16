import EventEmitter from 'events';

/** 最少采样次数 */
const MIN_SAMPLING_LENGTH = 4;
/** 最大采样次数 */
const MAX_SAMPLING_LENGTH = 10;
/** 最大采样时间 */
const MAX_SAMPLING_TIME = 30;
/** 摩擦力 */
const FRICTION = 0.025;

export interface SceneDragStartEvent {
  x: number;
  y: number;
}

export interface SceneDragEvent {
  x: number;
  y: number;
  /** 拖拽的距离 x */
  offsetX: number;
  /** 拖拽的距离 y */
  offsetY: number;
  /** 与上一次事件的差距 x */
  deltaX: number;
  /** 与上一次事件的差距 y */
  deltaY: number;
}

export interface SceneDragEndEvent {
  /** x 轴速度 单位为 `px / ms` */
  velocityX: number;
  /** y 轴速度 单位为 `px / ms` */
  velocityY: number;
}

export interface SceneDragInertiaEvent {
  /** 与上一次事件的差距 x */
  deltaX: number;
  /** 与上一次事件的差距 y */
  deltaY: number;
}

export interface SceneWheelEvent {
  delta: number;
}

export interface SceneScaleEvent {
  /** 缩放值 */
  scale: number;
  /** 与上一次事件的差距 */
  deltaScale: number;
}

export interface SceneResizeEvent {
  width: number;
  height: number;
}

export interface EventMap {
  dragStart: SceneDragStartEvent;
  drag: SceneDragEvent;
  dragEnd: SceneDragEndEvent;
  dragInertia: SceneDragInertiaEvent;
  scale: SceneScaleEvent;
  wheel: SceneWheelEvent;
  resize: SceneResizeEvent;
  // eslint-disable-next-line no-use-before-define
  destory: Emitter;
}

export type EventType = keyof EventMap;
export type Action<T extends EventType> = (event: EventMap[T]) => void;

export default class Emitter {
  /** 绑定的 canvas */
  private target;

  /** 事件管理中心 */
  protected emitter: EventEmitter = new EventEmitter().setMaxListeners(0);

  private dragStartX = 0;

  private dragStartY = 0;

  private rafId = -1;

  /** [x, y, time] */
  private path: [number, number, number][] = [];

  constructor(target: HTMLElement) {
    this.target = target;
    this.init();
  }

  /**
   * 添加指令到事件
   * @param type 事件类型
   * @param action 指令
   */
  public addListener<T extends EventType>(type: T, action: Action<T>) {
    this.emitter.addListener(type, action);
  }

  public on = this.addListener;

  /**
   * 移除指令从事件
   * @param type 事件类型
   * @param action 指令
   */
  public removeListener<T extends EventType>(type: T, action: Action<T>) {
    this.emitter.removeListener(type, action);
  }

  public off = this.removeListener;

  /**
   * 触发事件
   * @param type 事件类型
   * @param event 事件内容
   */
  public emit<T extends EventType>(type: T, event: EventMap[T]) {
    this.emitter.emit(type, event);
  }

  private init() {
    const { target } = this;
    target.addEventListener('touchstart', this.ontouchstart);
    target.addEventListener('mousedown', this.onmousedown);
    target.addEventListener('wheel', this.onwheel);
    window.addEventListener('resize', this.onresize);
  }

  /**
   * 销毁节点
   */
  public destory() {
    const { target } = this;
    target.removeEventListener('touchstart', this.ontouchstart);
    target.removeEventListener('touchmove', this.ontouchmove);
    target.removeEventListener('touchend', this.ontouchend);
    target.removeEventListener('touchcancel', this.ontouchend);
    target.removeEventListener('mousedown', this.onmousedown);
    window.removeEventListener('mousemove', this.onmousemove, true);
    window.removeEventListener('mouseup', this.onmouseup, true);
    window.removeEventListener('blur', this.onblur, false);
    target.removeEventListener('wheel', this.onwheel);
    window.removeEventListener('resize', this.onresize);
    cancelAnimationFrame(this.rafId);
    this.emit('destory', this);
    this.emitter.removeAllListeners();
  }

  public updateSize() {
    this.onresize();
  }

  private dragStart(x: number, y: number, time: number) {
    this.dragStartX = x;
    this.dragStartY = y;
    this.path = [[x, y, time]];

    cancelAnimationFrame(this.rafId);

    this.emitter.emit('dragStart', { x, y });
  }

  private drag(x: number, y: number, time: number) {
    const { path } = this;
    const [lastX, lasyY] = path[path.length - 1];

    if (path.length >= MAX_SAMPLING_LENGTH) path.shift();
    path.push([x, y, time]);

    this.emitter.emit('drag', {
      x,
      y,
      offsetX: x - this.dragStartX,
      offsetY: y - this.dragStartY,
      deltaX: x - lastX,
      deltaY: y - lasyY,
    });
  }

  private dragEnd() {
    const { path } = this;
    let vx = 0;
    let vy = 0;

    if (path.length >= MIN_SAMPLING_LENGTH) {
      const [lastX, lastY, lastTime] = path.pop()!;
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
    this.emitter.emit('dragEnd', { velocityX: vx, velocityY: vy });
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

      this.emitter.emit('dragInertia', { deltaX, deltaY });
    });
  }

  private ontouchstart = (ev: TouchEvent) => {
    const { clientX, clientY } = ev.touches[0];
    this.dragStart(clientX, clientY, performance.now());

    // TODO: 未实现 scale

    const { target } = this;
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

    const { target } = this;
    target.addEventListener('touchstart', this.ontouchstart);
    target.removeEventListener('touchmove', this.ontouchmove);
    target.removeEventListener('touchend', this.ontouchend);
    target.removeEventListener('touchcancel', this.ontouchend);
  };

  // TODO: 此处应有缩放
  // private onscale() {
  //
  // }

  private onmousedown = (ev: MouseEvent) => {
    if (ev.button !== 0) return;

    const { clientX, clientY } = ev;
    this.dragStart(clientX, clientY, performance.now());

    const { target } = this;
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

    const { target } = this;
    target.addEventListener('mousedown', this.onmousedown);
    window.removeEventListener('mousemove', this.onmousemove, true);
    window.removeEventListener('mouseup', this.onmouseup, true);
    window.removeEventListener('blur', this.onblur, false);
  };

  private onblur = () => {
    this.dragEnd();
  };

  private onwheel = (ev: WheelEvent) => {
    this.emitter.emit('wheel', { delta: ev.deltaY });
  };

  private onresize = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.emitter.emit('resize', { width, height });
  };
}

import * as THREE from 'three';
import { D90, D180 } from '@/utils/consts';
import type {
  SceneDragEvent,
  SceneDragInertiaEvent,
  SceneWheelEvent,
  SceneResizeEvent,
  EventType,
  Action,
  EventMap,
} from './Emitter';
import Emitter from './Emitter';
import type Panorama from '../geometry/Panorama';
import { SphToUv } from '@/utils/geometry';

// 视角
const DEFAULT_FOV = 90;
const MIN_FOV = 2;
const MAX_FOV = 100;
// 视角缩放步长
const FOV_STEP = 0.001;

// 默认镜头方向
const DEFAULT_PHI = D90;
const DEFAULT_THETA = D180;

export default class Control {
  private canvas;
  private camera;
  private panorama;
  private emitter;

  private width = 0;
  private height = 0;

  // 镜头朝向
  private direction;

  // 定时器 id;
  private rafId = -1;

  /**
   * 构造全景图场景
   * @param canvas 绑定的 canvas 元素
   * @param camera 绑定的摄像机对象
   * @param panorama 绑定的全景图对象
   */
  constructor(
    canvas: HTMLCanvasElement,
    camera: THREE.PerspectiveCamera,
    panorama: Panorama,
  ) {
    this.canvas = canvas;
    this.camera = camera;
    this.panorama = panorama;
    this.emitter = new Emitter(this.canvas);
    this.direction = new THREE.Spherical();
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
    const { camera, emitter } = this;
    emitter.on('drag', this.drag);
    emitter.on('dragInertia', this.drag);
    emitter.on('wheel', this.wheel);
    camera.fov = DEFAULT_FOV;
    this.setDirection(DEFAULT_PHI, DEFAULT_THETA);
  }

  public destory() {
    cancelAnimationFrame(this.rafId);
    this.emitter.destory();
  }

  private updateObjects() {
    const { phi, theta } = this.direction;
    const { fov } = this.camera;
    const level = Math.floor(Math.log2(90 / fov)) + 1;
    const dFov = (fov / 180) * D180;
    this.panorama.update(level, ...SphToUv(phi - dFov, theta - dFov));
    this.panorama.update(level, ...SphToUv(phi - dFov, theta));
    this.panorama.update(level, ...SphToUv(phi - dFov, theta + dFov));
    this.panorama.update(level, ...SphToUv(phi, theta - dFov));
    this.panorama.update(level, ...SphToUv(phi, theta));
    this.panorama.update(level, ...SphToUv(phi, theta + dFov));
    this.panorama.update(level, ...SphToUv(phi + dFov, theta - dFov));
    this.panorama.update(level, ...SphToUv(phi + dFov, theta));
    this.panorama.update(level, ...SphToUv(phi + dFov, theta + dFov));
    this.camera.updateProjectionMatrix();
  }

  public setSize = (size: SceneResizeEvent) => {
    const { camera } = this;
    const { width, height } = size;
    this.width = width;
    this.height = height;
    // this.renderer.setSize(width, height);
    camera.aspect = width / height;
    this.updateObjects();
  };

  public setDirection(phi: number, theta: number) {
    const { camera, direction } = this;

    direction.phi = phi;
    direction.theta = theta;
    direction.makeSafe();

    const vec = new THREE.Vector3().setFromSpherical(this.direction);
    camera.lookAt(vec.add(camera.position));
    this.updateObjects();
  }

  private drag = (ev: SceneDragEvent | SceneDragInertiaEvent) => {
    const { camera, direction, width, height } = this;

    // 拖拽时每 px 旋转的弧度
    const stepY = (camera.fov * (D180 / 180)) / height;
    // 倾斜角补偿
    const scaleX = Math.sin(direction.phi);
    // 最多旋转 180 度
    const stepX = Math.min(stepY / scaleX, D180 / width);

    const deltaX = -ev.deltaX * stepX;
    const deltaY = -ev.deltaY * stepY;
    const theta = direction.theta - deltaX;
    const phi = direction.phi + deltaY;

    this.setDirection(phi, theta);
  };

  private wheel = (ev: SceneWheelEvent) => {
    const { camera } = this;
    // const { phi, theta } = this.direction;

    const fov = camera.fov * (1 + ev.delta * FOV_STEP);
    camera.fov = Math.max(MIN_FOV, Math.min(fov, MAX_FOV));

    // const delta = ev.delta / 100;
    // const x = Math.sin(phi) * Math.sin(theta) * delta;
    // const y = Math.cos(phi) * delta;
    // const z = Math.sin(phi) * Math.cos(theta) * delta;
    // camera.position.x -= x;
    // camera.position.y -= y;
    // camera.position.z -= z;

    this.emitter.updateSize();
    this.updateObjects();
  };
}

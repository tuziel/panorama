import * as THREE from 'three';
import type { Object3D } from 'three';
import { D90, D180 } from '@/utils/consts';
import type {
  SceneDragEvent,
  SceneDragInertiaEvent,
  SceneWheelEvent,
  SceneResizeEvent,
} from './control';
import Control from './control';

// 视角
const DEFAULT_FOV = 90;
const MIN_FOV = 2;
const MAX_FOV = 100;
// 视角缩放步长
const FOV_STEP = 0.001;

// 默认镜头方向
const DEFAULT_PHI = D90;
const DEFAULT_THETA = D180;

/** 场景配置 */
type SceneOptions = {
  /** 场景尺寸是否跟随屏幕尺寸 */
  autoSize: boolean;
};

export default class Scene {
  private canvas;
  private scene;
  private camera;
  private renderer;
  private control;

  private width = 0;
  private height = 0;

  // 镜头朝向
  private direction;

  // 定时器 id;
  private rafId = -1;

  /** 场景尺寸是否跟随屏幕尺寸 */
  private __autoSize = true;
  get autoSize() {
    return this.__autoSize;
  }
  set autoSize(val: boolean) {
    this.__autoSize = val;
    if (val) {
      this.control.on('resize', this.setSize);
    } else {
      this.control.off('resize', this.setSize);
    }
  }

  /**
   * 构造全景图场景
   * @param canvas 绑定的 canvas 元素
   */
  constructor(canvas: HTMLCanvasElement, options?: SceneOptions) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(DEFAULT_FOV);
    this.renderer = new THREE.WebGLRenderer({ canvas: canvas });

    const autoSize = options?.autoSize ?? true;
    const control = new Control(this.canvas);
    control.on('drag', this.drag);
    control.on('dragInertia', this.drag);
    control.on('wheel', this.wheel);
    if (autoSize) {
      control.on('resize', this.setSize);
      control.updateSize();
    } else {
      this.setSize(canvas);
    }
    this.control = control;
    this.direction = new THREE.Spherical();
    this.setDirection(DEFAULT_PHI, DEFAULT_THETA);

    const raf = (fn: () => void) => {
      this.rafId = requestAnimationFrame(() => raf(fn));
      fn();
    };
    raf(() => this.renderer.render(this.scene, this.camera));
  }

  public destory() {
    cancelAnimationFrame(this.rafId);
    this.control.destory();
  }

  public add(...object: Object3D[]) {
    this.scene.add(...object);
    return this;
  }

  public remove(...object: Object3D[]) {
    this.scene.remove(...object);
    return this;
  }

  public setSize = (size: SceneResizeEvent) => {
    const camera = this.camera;
    const { width, height } = size;
    this.width = width;
    this.height = height;
    this.renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };

  public setDirection(phi: number, theta: number) {
    const { camera, direction } = this;

    direction.phi = phi;
    direction.theta = theta;
    direction.makeSafe();

    const vec = new THREE.Vector3().setFromSpherical(this.direction);
    camera.lookAt(vec.add(camera.position));
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
    const camera = this.camera;
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

    this.control.updateSize();
    camera.updateProjectionMatrix();
  };
}

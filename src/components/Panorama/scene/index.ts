import * as THREE from 'three';
import { Object3D } from 'three';
import { D90, D180 } from 'src/utils/consts';
import Control, {
  SceneDragEvent,
  SceneDragInertiaEvent,
  SceneWheelEvent,
  SceneResizeEvent,
} from './control';

// 视角
const DEFAULT_FOV = 90;
const MIN_FOV = 10;
const MAX_FOV = 100;
const DEFAULT_PHI = D90;
const DEFAULT_THETA = D180;
// 视点
// const DEFALUT_Z = 0;
// const MIN_Z = -6;
// const MAX_Z = 20;

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
    this.direction = new THREE.Spherical(1, DEFAULT_PHI, DEFAULT_THETA);

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
    const { camera, direction, height } = this;

    // 拖拽时每 px 旋转的弧度
    const step = (camera.fov * (D180 / 180)) / height;

    const deltaX = -ev.deltaX * step;
    const deltaY = -ev.deltaY * step;
    // 倾斜角补偿
    const scaleX = Math.max(Math.sin(D90 / 3), Math.sin(direction.phi));
    const theta = direction.theta - deltaX / scaleX;
    const phi = direction.phi + deltaY;

    this.setDirection(phi, theta);
  };

  private wheel = (ev: SceneWheelEvent) => {
    const camera = this.camera;

    let fov = camera.fov + ev.delta / 20;
    camera.fov = Math.max(MIN_FOV, Math.min(fov, MAX_FOV));

    // const z = camera.position.z + ev.delta / 100;
    // camera.position.z = Math.max(-6, Math.min(z, 20));

    this.control.updateSize();
    camera.updateProjectionMatrix();
  };
}

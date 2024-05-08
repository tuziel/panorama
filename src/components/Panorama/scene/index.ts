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
// 视点
// const DEFALUT_Z = 0;
// const MIN_Z = -6;
// const MAX_Z = 20;

export default class Scene {
  private canvas;
  private scene;
  private camera;
  private renderer;
  private control;
  private width = 0;
  private height = 0;
  private direction = new THREE.Spherical(1, D90, D180);

  // 定时器 id;
  private rafId = -1;
  // 拖拽时每 px 旋转的弧度
  private step = 0;

  /**
   * 构造全景图场景
   * @param canvas 绑定的 canvas 元素
   */
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(DEFAULT_FOV);
    this.renderer = new THREE.WebGLRenderer({ canvas: canvas });

    const control = new Control(this.canvas);
    control.on('drag', this.drag);
    control.on('dragInertia', this.drag);
    control.on('wheel', this.wheel);
    control.on('resize', this.updateSize);
    control.updateSize();
    this.control = control;

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

  private updateSize = (size: SceneResizeEvent) => {
    const camera = this.camera;
    const { width, height } = size;
    this.width = width;
    this.height = height;
    this.step = (camera.fov * (D180 / 180)) / height;
    this.renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };

  private updateDirection(theta: number, phi: number) {
    const { camera, direction } = this;

    direction.theta = theta;
    direction.phi = phi;
    direction.makeSafe();

    const vec = new THREE.Vector3().setFromSpherical(this.direction);
    camera.lookAt(vec);
  }

  private drag = (ev: SceneDragEvent | SceneDragInertiaEvent) => {
    const { direction, step } = this;

    const deltaX = -ev.deltaX * step;
    const deltaY = -ev.deltaY * step;

    this.updateDirection(direction.theta - deltaX, direction.phi + deltaY);
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

import * as THREE from 'three';
import { Object3D } from 'three';
import { D90, D180, G_SZIE } from 'src/utils/consts';
import Control, {
  SceneDragEvent,
  SceneDragInertiaEvent,
  SceneWheelEvent,
  SceneResizeEvent,
} from './control';

/** 3D 物件的半径 */

export default class Scene {
  private canvas;
  private scene;
  private camera;
  private renderer;
  private control;

  // 定时器 id;
  private rafId = -1;
  // 拖拽时每 px 旋转的弧度
  private step = 0;
  // 视角
  private fov = 90;
  // 视点
  private z = 0;
  private minFov = 10;
  private maxFov = 100;
  private minZ = -6;
  private maxZ = 20;

  /**
   * 构造全景图场景
   * @param canvas 绑定的 canvas 元素
   */
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(this.fov);
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
    // XXX: fov 更新时没有更新 step, 会导致拖拽行为异常
    this.step = (camera.fov * (D180 / 180)) / height;
    this.renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };

  private drag = (ev: SceneDragEvent | SceneDragInertiaEvent) => {
    const { scene, camera, step } = this;

    const distance = Math.min(camera.position.z, G_SZIE);
    const alpha = camera.fov * (D180 / 180);
    const beta = Math.asin((distance * Math.sin(alpha)) / G_SZIE);
    const deltaX = -ev.deltaY * step * (beta / alpha + 1);
    const deltaY = -ev.deltaX * step * (beta / alpha + 1);

    scene.rotation.x += deltaX;
    scene.rotation.x = Math.max(-D90, Math.min(scene.rotation.x, D90));
    scene.rotation.y += deltaY;
  };

  private wheel = (ev: SceneWheelEvent) => {
    const camera = this.camera;

    let fov = camera.fov + ev.delta / 20;
    this.fov = camera.fov = Math.max(this.minFov, Math.min(fov, this.maxFov));
    camera.updateProjectionMatrix();
  };
}

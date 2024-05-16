import * as THREE from 'three';
import type { Object3D } from 'three';
import Control from '../Control';
import type { SceneResizeEvent } from '../Control/Emitter';
import Emitter from '../Control/Emitter';
import type { PanoramaOptions } from '../geometry/PanoramaSphere';
import Panorama from '../geometry/PanoramaSphere';

/** 场景配置 */
export type SceneOptions = {
  /** 场景尺寸是否跟随屏幕尺寸 */
  autoSize?: boolean;
} & PanoramaOptions;

export default class Scene {
  private canvas;
  private scene;
  private camera;
  private renderer;
  private emitter;
  private panorama;
  private control;

  private width = 0;
  private height = 0;

  // 定时器 id;
  private rafId = -1;

  /** 场景尺寸是否跟随屏幕尺寸 */
  private $autoSize = true;
  get autoSize() {
    return this.$autoSize;
  }
  set autoSize(val: boolean) {
    this.$autoSize = val;
    if (val) {
      this.emitter.on('resize', this.setSize);
    } else {
      this.emitter.off('resize', this.setSize);
    }
  }

  /**
   * 构造全景图场景
   * @param canvas 绑定的 canvas 元素
   */
  constructor(canvas: HTMLCanvasElement, options: SceneOptions = {}) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera();
    this.renderer = new THREE.WebGLRenderer({ canvas });
    this.emitter = new Emitter(this.canvas);
    this.panorama = new Panorama(options);
    this.control = new Control(canvas, this.camera, this.panorama);
    this.autoSize = options?.autoSize ?? true;
    this.init();
  }

  private init() {
    if (this.autoSize) {
      this.emitter.on('resize', this.setSize);
      this.emitter.updateSize();
    } else {
      this.setSize(this.canvas);
    }

    this.add(this.panorama.getMesh());

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
    const { width, height } = size;
    this.width = width;
    this.height = height;
    this.renderer.setSize(width, height);
    this.control.setSize(size);
  };
}

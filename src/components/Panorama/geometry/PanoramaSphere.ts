import * as THREE from 'three';
import { G_SZIE } from '@/utils/consts';
import { Side, loadImage } from '@/utils/geometry';
import { times } from 'lodash';

type TileMapping = (level: number, side: Side, u: number, v: number) => string;

const cache = new Map<string, Promise<HTMLImageElement>>();

export type PanoramaOptions = {
  /**
   * 如何生成 url
   * @param level 缩放层级
   * @param side 方向
   * @param x 对应行
   * @param y 对应列
   */
  tileMapping?: TileMapping;

  tileSize?: number;

  minLevel?: number;

  maxLevel?: number;
};

// 环境贴图投影到球面内部
// 球体方向 => [镜头方向, 贴图位置, u, v]
type MappingFn = (u: number, v: number) => [Side, Side, number, number];

const sideMapping: Record<Side, MappingFn> = {
  [Side.RIGHT]: (u, v) => [Side.RIGHT, Side.RIGHT, 1 - u, v],
  [Side.LEFT]: (u, v) => [Side.LEFT, Side.LEFT, 1 - u, v],
  [Side.TOP]: (u, v) => [Side.TOP, Side.BOTTOM, u, 1 - v],
  [Side.BOTTOM]: (u, v) => [Side.BOTTOM, Side.TOP, u, 1 - v],
  [Side.FRONT]: (u, v) => [Side.BACK, Side.BACK, 1 - u, v],
  [Side.BACK]: (u, v) => [Side.FRONT, Side.FRONT, 1 - u, v],
};

const defaultOptions: Required<PanoramaOptions> = {
  tileMapping: () => '',
  tileSize: 512,
  minLevel: 1,
  maxLevel: 1,
};

export default class Panorama {
  private mesh: THREE.Mesh;

  private tileMapping;

  private tileSize;

  private minLevel;

  private maxLevel;

  private fullSize;

  private textureData = times(6, () => document.createElement('canvas'));

  private texture = new THREE.CubeTexture();

  private material: THREE.MeshBasicMaterial;

  private dones = new Set<string>();

  constructor(options: PanoramaOptions = {}) {
    const geometry = new THREE.SphereGeometry(G_SZIE, 180, 90).scale(1, 1, -1);
    this.material = new THREE.MeshBasicMaterial();
    this.mesh = new THREE.Mesh(geometry, this.material);

    const opts = { ...defaultOptions, ...options };
    this.tileMapping = opts.tileMapping;
    this.tileSize = opts.tileSize;
    this.minLevel = opts.minLevel;
    this.maxLevel = opts.maxLevel;
    this.fullSize = this.tileSize * 2 ** (this.maxLevel - this.minLevel);
    this.textureData.forEach((canvas) => {
      canvas.width = canvas.height = this.fullSize;
    });
    this.texture = new THREE.CubeTexture([...this.textureData]);
    this.texture.flipY = true;
    this.material.setValues({ envMap: this.texture });

    this.init();
  }

  private init() {
    this.textureData.forEach((_, side) => this.updateTexture(1, side, 0, 0));
  }

  public getMesh() {
    return this.mesh;
  }

  public updateTexture(level: number, side: Side, u: number, v: number) {
    const level2 = Math.min(Math.max(this.minLevel, level), this.maxLevel);
    const segments = 2 ** (level2 - 1);
    const [sideCamera, sideEnv, u2, v2] = sideMapping[side](u, v);
    const x = Math.min(Math.floor(u2 * segments), segments - 1) + 1;
    const y = Math.min(Math.floor(v2 * segments), segments - 1) + 1;

    const url = this.tileMapping(level2, sideCamera, x, y);
    const key = `${level2}-${sideCamera}-${x}-${y}`;
    if (this.dones.has(key)) return;

    const loader = cache.has(url) ? cache.get(url)! : loadImage(url);
    this.dones.add(key);

    const context = this.textureData[sideEnv].getContext('2d')!;
    const size = this.fullSize / segments;
    loader.then((image) => {
      const srcSize = Math.max(image.width, image.height);
      context.drawImage(
        image,
        (x - 1) * size,
        (y - 1) * size,
        (image.width / srcSize) * size,
        (image.height / srcSize) * size,
      );
      const data = context.getImageData(0, 0, this.fullSize, this.fullSize);
      this.texture.images[sideEnv] = data;
      this.texture.needsUpdate = true;
      this.material.needsUpdate = true;
    });
  }
}

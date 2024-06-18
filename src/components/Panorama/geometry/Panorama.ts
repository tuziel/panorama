import * as THREE from 'three';
import { D180, D270, D90 } from '@/utils/consts';
import { Side, clamp, loadImage } from '@/utils/geometry';

type TileMapping = (level: number, side: Side, x: number, y: number) => string;

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

  tiledImageSize?: number[] | [number, number][];

  minLevel?: number;

  maxLevel?: number;
};

type TileMeta = {
  key: string;
  url: string;
  level: number;
  x: number;
  y: number;
  width: number;
  height: number;
  side: Side;
  radius: number;
  offsetU: number;
  offsetV: number;
};

// 环境贴图投影到球面内部
// 球体方向 => [镜头方向, 贴图位置, u, v]
type MappingFn = (u: number, v: number) => [Side, number, number];

const sideMapping: Record<Side, MappingFn> = {
  [Side.RIGHT]: (u, v) => [Side.RIGHT, 1 - u, v],
  [Side.LEFT]: (u, v) => [Side.LEFT, 1 - u, v],
  [Side.TOP]: (u, v) => [Side.TOP, u, 1 - v],
  [Side.BOTTOM]: (u, v) => [Side.BOTTOM, u, 1 - v],
  [Side.FRONT]: (u, v) => [Side.BACK, 1 - u, v],
  [Side.BACK]: (u, v) => [Side.FRONT, 1 - u, v],
};

// x, y, z, rotateX, rotateY
type XYZRXY = [number, number, number, number, number];
const transfroms: ((meta: TileMeta) => XYZRXY)[] = [
  (meta) => [meta.radius, meta.offsetV, meta.offsetU, 0, D270],
  (meta) => [-meta.radius, meta.offsetV, -meta.offsetU, 0, D90],
  (meta) => [meta.offsetU, meta.radius, meta.offsetV, D90, 0],
  (meta) => [meta.offsetU, -meta.radius, -meta.offsetV, D270, 0],
  (meta) => [meta.offsetU, meta.offsetV, -meta.radius, 0, 0],
  (meta) => [-meta.offsetU, meta.offsetV, meta.radius, 0, D180],
];

const normalize = (positions: THREE.TypedArray, unit = 1) => {
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const y = positions[i + 1];
    const z = positions[i + 2];
    const vet = new THREE.Vector3(x, y, z).normalize();
    positions[i] = vet.x * unit;
    positions[i + 1] = vet.y * unit;
    positions[i + 2] = vet.z * unit;
  }
  return positions;
};

const defaultOptions: Required<PanoramaOptions> = {
  tileMapping: () => '',
  tileSize: 1024,
  tiledImageSize: [],
  minLevel: 1,
  maxLevel: 4,
};

export default class Panorama {
  private scene: THREE.Scene;

  private tileMapping;

  private tileSize;

  private tiledImageSize: [number, number][] = [];

  private minLevel;

  private maxLevel;

  private tiles = new Set<string>();

  constructor(scene: THREE.Scene, options: PanoramaOptions = {}) {
    this.scene = scene;

    const opts = { ...defaultOptions, ...options };
    this.tileMapping = opts.tileMapping;
    this.tileSize = opts.tileSize;
    this.minLevel = opts.minLevel;
    this.maxLevel = opts.maxLevel;
    this.init(opts);
  }

  private init(options: Required<PanoramaOptions>) {
    this.initTiledImageSize(options.tiledImageSize);
    this.initMinLevel();
  }

  private initTiledImageSize(tiledImageSize: number[] | [number, number][]) {
    const { minLevel, maxLevel, tileSize } = this;
    let width = tileSize;
    let height = tileSize;

    for (let level = minLevel; level <= maxLevel; level++) {
      const imageSize = tiledImageSize[level];

      if (typeof imageSize === 'number') {
        width = imageSize;
        height = imageSize;
      } else if (Array.isArray(imageSize)) {
        [width, height] = imageSize;
      }

      this.tiledImageSize[level] = [width, height];
      width *= 2;
      height *= 2;
    }
  }

  private initMinLevel() {
    for (let side = 0; side < 6; side++) {
      this.update(1, side, 0, 0);
    }
  }

  private createTile(meta: TileMeta) {
    const geometry = new THREE.PlaneGeometry(
      meta.width,
      meta.height,
      Math.ceil(meta.width * 5),
      Math.ceil(meta.height * 5),
    );

    loadImage(meta.url).then((image) => {
      const texture = new THREE.Texture(image);
      texture.needsUpdate = true;
      const material = new THREE.MeshBasicMaterial({ map: texture });
      const mesh = new THREE.Mesh(geometry, material);
      const [x, y, z, rX, rY] = transfroms[meta.side](meta);
      geometry.rotateX(rX).rotateY(rY).translate(x, y, z);
      // XXX: 不应该有不同的 radius
      normalize(geometry.getAttribute('position').array, meta.radius);
      mesh.renderOrder = meta.level;

      this.scene.add(mesh);
    });
  }

  public update(level: number, side: Side, u: number, v: number) {
    const meta = this.getTileMeta(level, side, u, v);
    if (this.tiles.has(meta.key)) return;
    this.tiles.add(meta.key);
    this.createTile(meta);
  }

  public getTileMeta(
    level: number,
    side: Side,
    u: number,
    v: number,
  ): TileMeta {
    const level2 = clamp(level, this.minLevel, this.maxLevel);
    const [sideCamera, u2, v2] = sideMapping[side](u, v);
    const [tiledImageWidth, tiledImageHeight] = this.tiledImageSize[level2];
    const radius = 10 - level2;
    const size = radius * 2;
    const pxX = clamp(u2 * tiledImageWidth - 0.5, 0, tiledImageWidth - 1);
    const pxY = clamp(v2 * tiledImageHeight - 0.5, 0, tiledImageHeight - 1);
    const x = Math.floor(pxX / this.tileSize);
    const y = Math.floor(pxY / this.tileSize);
    const sideWidth = tiledImageWidth / this.tileSize;
    const sideHeight = tiledImageHeight / this.tileSize;
    const unitWidth = size / sideWidth;
    const unitHeight = size / sideHeight;
    const nextX = Math.min(x + 1, sideWidth);
    const nextY = Math.min(y + 1, sideHeight);
    const width = (nextX - x) * unitWidth;
    const height = (nextY - y) * unitHeight;
    const offsetU = width / 2 - radius + x * unitWidth;
    const offsetV = -(height / 2 - radius + y * unitHeight);

    const url = this.tileMapping(level2, sideCamera, x + 1, y + 1);
    const key = `${level2}-${sideCamera}-${x}-${y}`;

    return {
      key,
      url,
      level: level2,
      x,
      y,
      width,
      height,
      side: sideCamera,
      radius,
      offsetU,
      offsetV,
    };
  }
}

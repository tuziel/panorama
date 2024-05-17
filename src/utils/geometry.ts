import { D180, D360 } from './consts';

/*
 * three.js 坐标系定义
 * x 轴从左向右
 * y 轴从下向上
 * z 轴从内向外
 * phi 极角从 +y 开始
 * theta 方位角从 +z 开始向 +x 方向旋转
 */

type Cartesian2 = [number, number];
type Cartesian3 = [number, number, number];
type Spherical = [number, number];
type RGBA = [number, number, number, number];
type ImageOrData = HTMLImageElement | ImageData;

type ColorPicker = (x: number, y: number) => RGBA;

type ColorPickerOprions = {
  /**
   * 滤镜
   * - linear: 线性插值
   * - nearest: 最近邻插值
   */
  filter?: 'linear' | 'nearest';

  /**
   * 坐标类型
   * - uv: 纹理贴图坐标
   * - xy: 像素坐标
   */
  coordinate?: 'uv' | 'xy';

  /** 使用像素坐标时的目标宽度 */
  dWidth?: number;

  /** 使用像素坐标时的目标高度 */
  dHeight?: number;
};

export enum Side {
  'RIGHT',
  'LEFT',
  'TOP',
  'BOTTOM',
  'FRONT',
  'BACK',
}

/**
 * 直角坐标转球坐标
 * @param x x 轴从左向右
 * @param y y 轴从下向上
 * @param z z 轴从内向外
 */
export function cartToSph01(x: number, y: number, z: number): Spherical {
  const xz = Math.sqrt(x * x + z * z);
  const phi = Math.atan2(xz, y);
  const theta = Math.atan2(x, z);

  return [phi, theta];
}

/**
 * 球坐标转直角坐标
 * @param phi 极角从 +y 开始
 * @param theta 方位角从 +z 开始向 +x 方向旋转
 */
export function sphToCart01(phi: number, theta: number): Cartesian3 {
  const x = Math.sin(theta);
  const y = Math.min(1 / Math.tan(phi), Number.MAX_VALUE);
  const z = Math.cos(theta);
  const scale = Math.max(Math.abs(x), Math.abs(y), Math.abs(z));

  return [x, y, z].map((n) => n / scale) as Cartesian3;
}

const uvToSphMapping: ((...args: Cartesian2) => Cartesian3)[] = [
  (u, v) => [1, -v, -u],
  (u, v) => [-1, -v, u],
  (u, v) => [u, 1, v],
  (u, v) => [u, -1, -v],
  (u, v) => [u, -v, 1],
  (u, v) => [-u, -v, -1],
];

/**
 * 获取立方体面坐标对应的球坐标
 * @param side 立方体面对应方向
 * @param u 对应的横坐标
 * @param v 对应的纵坐标
 */
export function uvToSph(side: Side, u: number, v: number) {
  const cart = uvToSphMapping[side](u * 2 - 1, v * 2 - 1);
  return cartToSph01(...cart);
}

const SphToUvMapping: ((...args: Cartesian3) => [Side, ...Cartesian2])[] = [
  (_, y, z) => [Side.RIGHT, -z, -y],
  (x, _, z) => [Side.TOP, x, z],
  (x, y) => [Side.FRONT, x, -y],
  (_, y, z) => [Side.LEFT, z, -y],
  (x, _, z) => [Side.BOTTOM, x, -z],
  (x, y) => [Side.BACK, -x, -y],
];

/**
 * 球坐标转六面图坐标
 * @param phi 极角从 +y 开始
 * @param theta 方位角从 +z 开始向 +x 方向旋转
 */
export function SphToUv(phi: number, theta: number): [Side, ...Cartesian2] {
  const cart = sphToCart01(phi, theta);
  // [ 1,  0,  0] +x 0b000001
  // [ 0,  1,  0] +y 0b000010
  // [ 0,  0,  1] +z 0b000100
  // [-1,  0,  0] -x 0b001111
  // [ 0, -1,  0] -y 0b011110
  // [ 0,  0, -1] -z 0b111100
  const vecSign = cart.reduce((s, v, i) => s | ((v & 0b1111) << i), 0);
  const index = countBits(vecSign) - 1;
  const [side, x, y] = SphToUvMapping[index](...cart);
  const u = (x + 1) / 2;
  const v = (y + 1) / 2;
  return [side, u, v];
}

/**
 * 球面全景图转正方体六面图
 * @param image 球面全景图
 * @param side 输出的立方体面
 * @param size 输出图片大小
 */
export function sphereImageToCubeImage(
  image: ImageOrData,
  side: Side,
  size?: number,
) {
  const { width, height } = image;
  const outSize = size || Math.min(width / 4, height / 2);

  const picker = createColorPicker(image);

  const imageData = new ImageData(outSize, outSize);

  let phi, theta, u, v, color;

  for (let sx = 0; sx < outSize; sx++) {
    for (let sy = 0; sy < outSize; sy++) {
      [phi, theta] = uvToSph(side, (sx + 0.5) / outSize, (sy + 0.5) / outSize);
      u = ((((theta + D180) / D360) % 1) + 1) % 1;
      v = (((phi / D180) % 1) + 1) % 1;

      color = picker(u, v);
      setColor(imageData, sx, sy, color);
    }
  }

  return imageData;
}

/**
 * 正方体六面图转球面全景图
 * @param right 右面
 * @param left 左面
 * @param top 上面
 * @param bottom 下面
 * @param front 前面
 * @param back 后面
 * @param size 输出图片大小
 */
export function cubeImageToSphereImage(
  right: ImageOrData,
  left: ImageOrData,
  top: ImageOrData,
  bottom: ImageOrData,
  front: ImageOrData,
  back: ImageOrData,
  size?: number,
) {
  const { width, height } = right;
  const baseSize = Math.min(width, height);
  const outWidth = (size || baseSize) * 4;
  const outHeight = (size || baseSize) * 2;

  const pickers = [
    createColorPicker(right),
    createColorPicker(left),
    createColorPicker(top),
    createColorPicker(bottom),
    createColorPicker(front),
    createColorPicker(back),
  ];

  const imageData = new ImageData(outWidth, outHeight);

  let phi, theta, side, u, v, color;

  for (let sx = 0; sx < outWidth; sx++) {
    for (let sy = 0; sy < outHeight; sy++) {
      phi = ((sy + 0.5) / outHeight) * D180;
      theta = ((sx + 0.5) / outWidth) * D360 - D180;
      [side, u, v] = SphToUv(phi, theta);

      color = pickers[side](u, v);
      setColor(imageData, sx, sy, color);
    }
  }

  return imageData;
}

/**
 * 从 canvas 中导出图片
 */
export function canvasToImage(canvas: HTMLCanvasElement) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) throw new Error('blob is undefined');

      const reader = new FileReader();
      reader.addEventListener('error', reject);
      reader.addEventListener('load', () => {
        const image = new Image();
        image.addEventListener('error', reject);
        image.addEventListener('load', () => resolve(image));
        image.src = reader.result as string;
      });
      reader.readAsDataURL(blob);
    });
  });
}

/**
 * 将图片转为 ImageData
 * @param image 图片
 */
export function imageToData(image: HTMLImageElement) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Context2D is not support');

  const { width, height } = image;
  canvas.width = width;
  canvas.height = height;

  context.drawImage(image, 0, 0);
  return context.getImageData(0, 0, width, height);
}

/**
 * 加载图片
 * @param src 图片的 src
 */
export function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

/**
 * 加载图片并创建 ImageData
 * @param src 图片的 src
 */
export function loadImageData(src: string) {
  return loadImage(src).then(imageToData);
}

/** 线性插值 */
export function createLinearPicker(image: ImageData) {
  const { width, data } = image;

  function picker(x: number, y: number): RGBA {
    const x1 = Math.floor(x);
    const x2 = Math.ceil(x);
    const y1 = Math.floor(y);
    const y2 = Math.ceil(y);

    const pr = x - x1;
    const pb = y - y1;
    const plt = (1 - pr) * (1 - pb);
    const plb = (1 - pr) * pb;
    const prt = pr * (1 - pb);
    const prb = pr * pb;

    const ilt = (y1 * width + x1) * 4;
    const ilb = (y2 * width + x1) * 4;
    const irt = (y1 * width + x2) * 4;
    const irb = (y2 * width + x2) * 4;

    const color: RGBA = [0, 0, 0, 0];
    for (let i = 0; i < 4; i++) {
      color[i] =
        data[ilt + i] * plt +
        data[ilb + i] * plb +
        data[irt + i] * prt +
        data[irb + i] * prb;
    }

    return color;
  }

  return picker;
}

/** 最近邻插值 */
export function createNearestPicker(image: ImageData) {
  const { width, data } = image;

  const picker: ColorPicker = (x: number, y: number) => {
    const index = (Math.round(y) * width + Math.round(x)) * 4;

    const color: RGBA = [
      data[index],
      data[index + 1],
      data[index + 2],
      data[index + 3],
    ];

    return color;
  };

  return picker;
}

/**
 * 包装将纹理 uv 坐标映射到图片像素坐标的函数
 * @param fn 操作函数
 * @param width 纹理宽度
 * @param height 纹理高度
 */
export function uvMapping<T>(
  fn: (x: number, y: number) => T,
  width: number,
  height: number,
) {
  /**
   * 取色器
   * @param u 纹理贴图 u 坐标
   * @param v 纹理贴图 v 坐标
   */
  return (u: number, v: number) => {
    const x = clamp(u * width - 0.5, 0, width - 1);
    const y = clamp(v * height - 0.5, 0, height - 1);
    return fn(x, y);
  };
}

/**
 * 包装将图片像素坐标缩放的函数
 * @param fn 操作函数
 * @param width 原始宽度
 * @param height 原始高度
 * @param dWidth 目标宽度
 * @param dHeight 目标高度
 */
export function xyMapping<T>(
  fn: (x: number, y: number) => T,
  width: number,
  height: number,
  dWidth: number,
  dHeight: number,
) {
  /**
   * 取色器
   * @param x 图片像素 x 坐标
   * @param y 图片像素 y 坐标
   */
  return (x: number, y: number) => {
    const x2 = clamp(scaleIndex(x, width / dWidth), 0, width - 1);
    const y2 = clamp(scaleIndex(y, height / dHeight), 0, height - 1);
    return fn(x2, y2);
  };
}

/**
 * 创建取色器
 * @param image 取色目标图片
 * @param options 取色器参数
 */
export function createColorPicker(
  image: ImageOrData,
  options?: ColorPickerOprions,
): ColorPicker {
  const { filter, coordinate, dWidth, dHeight } = {
    filter: 'linear',
    coordinate: 'uv',
    dWidth: 0,
    dHeight: 0,
    ...options,
  };

  const mapping = {
    uv: uvMapping,
    xy: xyMapping,
  }[coordinate]!;

  const creator = {
    linear: createLinearPicker,
    nearest: createNearestPicker,
  }[filter]!;

  const { width, height } = image;
  const isImgElm = image instanceof HTMLImageElement;
  const data = isImgElm ? imageToData(image) : image;
  const xyPicker = creator(data);
  const mappedPicker = mapping(
    xyPicker,
    width,
    height,
    dWidth || width,
    dHeight || height,
  );

  return mappedPicker;
}

export function setColor(image: ImageData, x: number, y: number, color: RGBA) {
  const index = (y * image.width + x) * 4;

  for (let i = 0; i < 4; i++) {
    image.data[index + i] = color[i];
  }
}

export function countBits(n: number) {
  let cnt = 0;
  for (let m = n; m; m >>= 1) cnt++;
  return cnt;
}

/**
 * 缩放像素坐标
 * @param index 像素坐标
 * @param scale 缩放比例
 */
export function scaleIndex(index: number, scale: number) {
  return (index + 0.5) * scale - 0.5;
}

/**
 * 保证数值在范围内
 * @param number 数值
 * @param lower 下界
 * @param upper 上界
 */
export function clamp(number: number, lower: number, upper: number) {
  if (number < lower) return lower;
  if (number > upper) return upper;
  return number;
}

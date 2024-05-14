import { D90, D180, D360, D270 } from './consts';

/**
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
export function SphToUv(phi: number, theta: number) {
  const cart = sphToCart01(phi, theta);
  // [ 1,  0,  0] +x 0b000001
  // [ 0,  1,  0] +y 0b000010
  // [ 0,  0,  1] +z 0b000100
  // [-1,  0,  0] -x 0b001111
  // [ 0, -1,  0] -y 0b011110
  // [ 0,  0, -1] -z 0b111100
  const vecSign = cart.reduce((s, v, i) => s | ((v & 0b1111) << i), 0);
  const index = countBits(vecSign) - 1;
  return SphToUvMapping[index](...sphToCart01(phi, theta));
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
  const outSizeS1 = outSize - 1;

  const picker = createColorPicker(image);

  const imageData = new ImageData(outSize, outSize);
  const data = imageData.data;

  let phi, theta, x, y, iData, color;

  for (let sx = 0; sx < outSize; sx++) {
    for (let sy = 0; sy < outSize; sy++) {
      [phi, theta] = uvToSph(side, sx / outSizeS1, sy / outSizeS1);
      x = ((((theta + D180) / D360) % 1) + 1) % 1;
      y = (((phi / D180) % 1) + 1) % 1;

      color = picker(x, y);
      iData = (sy * outSize + sx) * 4;
      for (let i = 0; i < 4; i++) {
        data[iData + i] = color[i];
      }
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
  const outWidthS1 = outWidth - 1;
  const outHeightS1 = outHeight - 1;

  const pickers = [
    createColorPicker(right),
    createColorPicker(left),
    createColorPicker(top),
    createColorPicker(bottom),
    createColorPicker(front),
    createColorPicker(back),
  ];

  const imageData = new ImageData(outWidth, outHeight);
  const data = imageData.data;

  let phi, theta, side, x, y, iData, color;

  for (let sx = 0; sx < outWidth; sx++) {
    for (let sy = 0; sy < outHeight; sy++) {
      phi = (sy / outHeightS1) * D180;
      theta = (sx / outWidthS1) * D360 - D180;
      [side, x, y] = SphToUv(phi, theta);
      x = (x + 1) / 2;
      y = (y + 1) / 2;

      color = pickers[side](x, y);
      iData = (sy * outWidth + sx) * 4;
      for (let i = 0; i < 4; i++) {
        data[iData + i] = color[i];
      }
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
      if (!blob) return reject(new Error('blob is undefined'));

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

/**
 * 创建基于 uv 坐标的取色器
 * @param image 取色目标图片
 */
export function createColorPicker(image: ImageOrData) {
  const { width, height } = image;
  const widthS1 = width - 1;
  const heightS1 = height - 1;
  const isImgElm = image instanceof HTMLImageElement;
  const data = isImgElm ? imageToData(image).data : image.data;

  /**
   * 取色器
   * @param u 图片列位置
   * @param v 图片行位置
   */
  function picker(u: number, v: number): RGBA {
    const x = u * widthS1;
    const y = v * heightS1;
    const pr = x % 1;
    const pb = y % 1;
    const plt = (1 - pr) * (1 - pb);
    const plb = (1 - pr) * pb;
    const prt = pr * (1 - pb);
    const prb = pr * pb;

    // 线性插值
    const sx = Math.floor(x);
    const sy = Math.floor(y);
    const sr = Math.ceil(x);
    const sb = Math.ceil(y);
    const ilt = (sy * width + sx) * 4;
    const ilb = (sb * width + sx) * 4;
    const irt = (sy * width + sr) * 4;
    const irb = (sb * width + sr) * 4;

    return [0, 1, 2, 3].map(
      (i) =>
        data[ilt + i] * plt +
        data[ilb + i] * plb +
        data[irt + i] * prt +
        data[irb + i] * prb,
    ) as RGBA;
  }

  return picker;
}

export function countBits(n: number) {
  let cnt = 0;
  while (n) {
    cnt++;
    n >>= 1;
  }
  return cnt;
}

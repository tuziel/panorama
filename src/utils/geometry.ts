import { D90, D180, D360 } from './consts';

type Cartesian2 = [number, number];
type Cartesian3 = [number, number, number];
type Latlng = [number, number];
type RGBA = [number, number, number, number];

export enum Side {
  'RIGHT',
  'LEFT',
  'TOP',
  'BOTTOM',
  'FRONT',
  'BACK',
}

/**
 * 直角坐标转经纬度
 * @param x x 轴指向屏幕内
 * @param y y 轴指向右
 * @param z z 轴指向下
 * @returns 经纬度 `lat = [-PI/2, PI/2]`, `lng = [-PI, PI]`
 */
export function cartToLatlng(x: number, y: number, z: number): Latlng {
  const xy = Math.sqrt(x * x + y * y);
  const lat = Math.atan2(z, xy);
  const lng = Math.atan2(y, x);

  return [lat, lng];
}

/**
 * 经纬度转直角坐标
 * @param lat 纬度 (与 x 轴的夹角)
 * @param lng 经度 (位矢在 x-y 面的投影与 x 轴的夹角)
 */
export function latlngToCart(lat: number, lng: number): Cartesian3 {
  const x = Math.cos(lng);
  const y = Math.sin(lng);
  const z = Math.tan(lat);
  const scale = Math.max(Math.abs(x), Math.abs(y), Math.abs(z));

  return [x, y, z].map((n) => n / scale) as Cartesian3;
}

const uvToLatlngMapping: ((...args: Cartesian2) => Cartesian3)[] = [
  (u, v) => [-u, 1, v],
  (u, v) => [u, -1, v],
  (u, v) => [v, u, -1],
  (u, v) => [-v, u, 1],
  (u, v) => [1, u, v],
  (u, v) => [-1, -u, v],
];

/**
 * 获取立方体面坐标对应的经纬度
 * @param side 立方体面对应方向
 * @param u 对应的横坐标
 * @param v 对应的纵坐标
 */
export function uvToLatlng(side: Side, u: number, v: number) {
  const cart = uvToLatlngMapping[side](u, v);
  return cartToLatlng(...cart);
}

const latlngToUvMapping: ((...args: Cartesian3) => [Side, ...Cartesian2])[] = [
  (_, y, z) => [Side.FRONT, y, z],
  (x, _, z) => [Side.RIGHT, -x, z],
  (x, y) => [Side.BOTTOM, y, -x],
  (_, y, z) => [Side.BACK, -y, z],
  (x, _, z) => [Side.LEFT, x, z],
  (x, y) => [Side.TOP, y, x],
];

/**
 * 经纬度转六面图坐标
 * @param lat 纬度
 * @param lng 经度
 */
export function latlngToUV(lat: number, lng: number) {
  const cart = latlngToCart(lat, lng);
  // [ 1,  0,  0] +x 0b000001
  // [ 0,  1,  0] +y 0b000010
  // [ 0,  0,  1] +z 0b000100
  // [-1,  0,  0] -x 0b001111
  // [ 0, -1,  0] -y 0b011110
  // [ 0,  0, -1] -z 0b111100
  const vecSign = cart.reduce((s, v, i) => s | ((v & 0b1111) << i), 0);
  const index = countBits(vecSign) - 1;
  return latlngToUvMapping[index](...latlngToCart(lat, lng));
}

/**
 * 球面全景图转正方体六面图
 * @param image 球面全景图
 * @param side 输出的立方体面
 * @param size 输出图片大小
 */
export function sphereImageToCubeImage(
  image: HTMLImageElement,
  side: Side,
  size?: number,
) {
  const { width, height } = image;
  const outSize = size || Math.min(width / 4, height / 2);

  const picker = createColorPicker(image);

  const imageData = new ImageData(outSize, outSize);
  const data = imageData.data;

  const coordToScale = (coord: number) => coord / (outSize / 2) - 1;
  const scaleToX = (lng: number) => ((lng + D180) / D360) * width;
  const scaleToY = (lat: number) => ((lat + D90) / D180) * height;

  let lat, lng, x, y, iData, color;

  for (let u = 0; u < outSize; u++) {
    for (let v = 0; v < outSize; v++) {
      [lat, lng] = uvToLatlng(side, coordToScale(u), coordToScale(v));

      x = scaleToX(lng);
      y = scaleToY(lat);
      color = picker(x, y);

      iData = (v * outSize + u) * 4;
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
  right: HTMLImageElement,
  left: HTMLImageElement,
  top: HTMLImageElement,
  bottom: HTMLImageElement,
  front: HTMLImageElement,
  back: HTMLImageElement,
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
  const data = imageData.data;

  const coordToLat = (coord: number) => (coord / outHeight) * D180 - D90;
  const coordToLng = (coord: number) => (coord / outWidth) * D360 - D180;
  const scaleToX = (u: number) => ((u + 1) / 2) * baseSize;
  const scaleToY = (v: number) => ((v + 1) / 2) * baseSize;

  let side, u, v, x, y, iData, color;

  for (let oX = 0; oX < outWidth; oX++) {
    for (let oY = 0; oY < outHeight; oY++) {
      [side, u, v] = latlngToUV(coordToLat(oY), coordToLng(oX));

      x = scaleToX(u);
      y = scaleToY(v);
      color = pickers[side](x, y);

      iData = (oY * outWidth + oX) * 4;
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
 * 创建支持小数坐标的取色器
 * @param image 取色目标图片
 */
export function createColorPicker(image: HTMLImageElement) {
  const { width, height } = image;
  const data = imageToData(image).data;

  /**
   * 取色器
   * @param x 图片的 x 坐标
   * @param y 图片的 y 坐标
   */
  function picker(x: number, y: number): RGBA {
    const pr = x % 1;
    const pb = y % 1;
    const plt = (1 - pr) * (1 - pb);
    const plb = (1 - pr) * pb;
    const prt = pr * (1 - pb);
    const prb = pr * pb;

    // 线性插值
    const sx = Math.min(Math.floor(x), width - 1);
    const sy = Math.min(Math.floor(y), height - 1);
    const sr = Math.min(sx + 1, width - 1);
    const sb = Math.min(sy + 1, height - 1);
    let ilt = sy * width + sx;
    let ilb = sb * width + sx;
    let irt = sy * width + sr;
    let irb = sb * width + sr;
    ilt *= 4;
    ilb *= 4;
    irt *= 4;
    irb *= 4;

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

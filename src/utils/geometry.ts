import { D90, D180, D360 } from './consts';

type RGBA = [number, number, number, number];

/**
 * 直角坐标转经纬度
 * @param x
 * @param y
 * @param z
 * @returns 经纬度 `lat = [-90, 90]`, `lng = [-180, 180]`
 */
export function xyz2latlng(x: number, y: number, z: number): [number, number] {
  const absx = Math.abs(x);
  const absy = Math.abs(y);
  const absxy = Math.sqrt(absx * absx + absy * absy);

  const lat = Math.atan2(z, absxy);
  let lng = Math.atan2(y, x);

  return [lat, lng];
}

export enum Side {
  'RIGHT',
  'LEFT',
  'TOP',
  'BOTTOM',
  'FRONT',
  'BACK',
}

/**
 * 获取立方体面坐标对应的经纬度
 * @param side 立方体面对应方向
 * @param u 对应的横坐标
 * @param v 对应的纵坐标
 */
export function uv2latlng(side: Side, u: number, v: number) {
  switch (side) {
    case Side.RIGHT:
      return xyz2latlng(-u, 1, v);
    case Side.LEFT:
      return xyz2latlng(u, -1, v);
    case Side.TOP:
      return xyz2latlng(v, u, -1);
    case Side.BOTTOM:
      return xyz2latlng(-v, u, 1);
    case Side.FRONT:
      return xyz2latlng(1, u, v);
    case Side.BACK:
      return xyz2latlng(-1, -u, v);
    // no defalut
  }
}

/**
 * 球面全景图转正方体六面图
 * @param image 球面全景图
 * @param side 输出的立方体面
 * @param size 输出图片大小
 */
export function sphereImage2CubeImage(
  image: HTMLImageElement,
  side: Side,
  size?: number,
) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) return Promise.reject();

  const { width, height } = image;
  const outSize = size || Math.min(width / 4, height / 2);

  const picker = createColorPicker(image);

  canvas.width = canvas.height = outSize;
  const cubeImageData = context.createImageData(outSize, outSize);
  const data = cubeImageData.data;

  const coord2scale = (coord: number) => coord / (outSize / 2) - 1;
  const scale2width = (lng: number) => (lng / D360) * width;
  const scale2height = (lat: number) => (lat / D180) * height;

  let lat, lng, w, h, iuv, color;

  for (let u = 0; u < outSize; u++) {
    for (let v = 0; v < outSize; v++) {
      [lat, lng] = uv2latlng(side, coord2scale(u), coord2scale(v));
      w = scale2width(lng + D180);
      h = scale2height(lat + D90);

      iuv = (v * outSize + u) * 4;
      color = picker(w, h);

      for (let i = 0; i < 4; i++) {
        data[iuv + i] = color[i];
      }
    }
  }

  context.putImageData(cubeImageData, 0, 0);
  return canvas2image(canvas);
}

/**
 * 从 canvas 中导出图片
 */
export function canvas2image(canvas: HTMLCanvasElement) {
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
 * 创建支持小数坐标的取色器
 * @param image 取色目标图片
 */
export function createColorPicker(image: HTMLImageElement) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) throw new Error();

  const { width, height } = image;
  canvas.width = width;
  canvas.height = height;
  context.drawImage(image, 0, 0);
  const data = context.getImageData(0, 0, width, height).data;

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

    const sx = Math.floor(x);
    const sy = Math.floor(y);
    let ilt = sy * width + sx;
    let ilb = ((sy + 1) % height) * width + sx;
    let irt = sy * width + ((sx + 1) % width);
    let irb = ((sy + 1) % height) * width + ((sx + 1) % width);
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

const D90 = Math.PI * 0.5;
const D180 = Math.PI;
// const D270 = Math.PI * 1.5;
const D360 = Math.PI * 2;

/**
 * 直角坐标转经纬度
 * @param x
 * @param y
 * @param z
 * @returns 经纬度 `lat = [-90, 90]`, `lng = [0, 360)`
 */
export function xyz2latlng(x: number, y: number, z: number): [number, number] {
  const absx = Math.abs(x);
  const absy = Math.abs(y);
  const absxy = Math.sqrt(absx * absx + absy * absy);

  const lat = Math.atan2(z, absxy);
  let lng = Math.atan2(y, x);
  if (lng < 0) lng += D360;

  return [lat, lng];
}

export enum Face {
  'FRONT',
  'BACK',
  'RIGHT',
  'LEFT',
  'UP',
  'DOWN',
}

/**
 * 获取立方体面坐标对应的经纬度
 * @param face 立方体面
 * @param u 对应的横坐标
 * @param v 对应的纵坐标
 */
export function uv2latlng(face: Face, u: number, v: number) {
  switch (face) {
    case Face.FRONT:
      return xyz2latlng(-1, -u, v);
    case Face.BACK:
      return xyz2latlng(1, u, v);
    case Face.RIGHT:
      return xyz2latlng(u, -1, v);
    case Face.LEFT:
      return xyz2latlng(-u, 1, v);
    case Face.UP:
      return xyz2latlng(-v, -u, -1);
    case Face.DOWN:
      return xyz2latlng(v, -u, 1);
    // no defalut
  }
}

/**
 * 球面全景图转正方体六面图
 * @param image 球面全景图
 * @param face 输出的立方体面
 * @param size 输出图片大小
 */
export function sphereImage2CubeImage(
  image: HTMLImageElement,
  face: Face,
  size?: number,
) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) return Promise.reject();

  const { width, height } = image;
  const outSize = size || Math.min(width / 4, height / 2);

  canvas.width = width;
  canvas.height = height;
  context.drawImage(image, 0, 0);
  const sphereData = context.getImageData(0, 0, width, height).data;

  canvas.width = canvas.height = outSize;
  const cubeImageData = context.createImageData(outSize, outSize);
  const data = cubeImageData.data;

  const coord2scale = (coord: number) => coord / (outSize / 2) - 1;
  const scale2width = (lng: number) => (lng / D360) * width;
  const scale2height = (lat: number) => (lat / D180) * height;

  let lat, lng, w, h, pr, pb, plt, plb, prt, prb, ilt, ilb, irt, irb, iuv;

  for (let u = 0; u < outSize; u++) {
    for (let v = 0; v < outSize; v++) {
      [lat, lng] = uv2latlng(face, coord2scale(u), coord2scale(v));
      w = scale2width(lng);
      h = scale2height(lat + D90);

      pr = w % 1;
      pb = h % 1;
      plt = (1 - pr) * (1 - pb);
      plb = (1 - pr) * pb;
      prt = pr * (1 - pb);
      prb = pr * pb;

      w = Math.floor(w);
      h = Math.floor(h);
      ilt = h * width + w;
      ilb = ((h + 1) % height) * width + w;
      irt = h * width + ((w + 1) % width);
      irb = ((h + 1) % height) * width + ((w + 1) % width);
      iuv = v * outSize + u;
      ilt *= 4;
      ilb *= 4;
      irt *= 4;
      irb *= 4;
      iuv *= 4;

      for (let i = 0; i < 4; i++) {
        data[iuv + i] =
          sphereData[ilt + i] * plt +
          sphereData[ilb + i] * plb +
          sphereData[irt + i] * prt +
          sphereData[irb + i] * prb;
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

import { useContext, useEffect, useRef } from 'react';
import PanoramaControlContext from '@/context/PanoramaControlContext';
import { Side, loadImage, sphereImageToCubeImage } from '@/utils/geometry';

const sides = [
  { side: Side.RIGHT, x: 2, y: 1 },
  { side: Side.LEFT, x: 0, y: 1 },
  { side: Side.TOP, x: 1, y: 0 },
  { side: Side.BOTTOM, x: 1, y: 2 },
  { side: Side.FRONT, x: 1, y: 1 },
  { side: Side.BACK, x: 3, y: 1 },
];

const Panorama: React.FC = () => {
  const { src } = useContext(PanoramaControlContext);
  const refCanvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!src) return;

    const canvas = refCanvas.current!;
    const context = canvas.getContext('2d')!;
    const size = 300;
    canvas.width = size * 4;
    canvas.height = size * 3;

    loadImage(src).then((image) => {
      sides.forEach(({ side, x, y }) => {
        const data = sphereImageToCubeImage(image, side, size);
        context.putImageData(data, x * size, y * size);
      });
    });
  }, [src]);

  return <canvas className="canvas" ref={refCanvas}></canvas>;
};

export default Panorama;

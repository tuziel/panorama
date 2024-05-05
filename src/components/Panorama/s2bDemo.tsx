import { useEffect, useRef } from 'react';
import { Side, sphereImage2CubeImage } from '../../utils/geometry';
import imageUrl from '../../assets/demo1.jpg';

interface PanoramaProps {
  src: string;
}

const sides = [
  { side: Side.FRONT, x: 1, y: 1 },
  { side: Side.BACK, x: 3, y: 1 },
  { side: Side.LEFT, x: 0, y: 1 },
  { side: Side.RIGHT, x: 2, y: 1 },
  { side: Side.UP, x: 1, y: 0 },
  { side: Side.DOWN, x: 1, y: 2 },
];

const Panorama: React.FC<PanoramaProps> = () => {
  const refCanvas = useRef<HTMLCanvasElement>(null);

  function loadImage(...srcs: string[]) {
    return Promise.all<HTMLImageElement>(
      srcs.map(
        (src) =>
          new Promise((resolve, reject) => {
            var image = new Image();
            image.onload = () => resolve(image);
            image.onerror = reject;
            image.src = src;
          }),
      ),
    );
  }

  useEffect(() => {
    let canvas: HTMLCanvasElement;
    canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    const size = 300;
    canvas.width = size * 4;
    canvas.height = size * 3;

    loadImage(imageUrl)
      .then(([image]) =>
        Promise.all(
          sides.map(({ side }) => sphereImage2CubeImage(image, side, size)),
        ),
      )
      .then((images) => {
        images.forEach((image, side) => {
          context.drawImage(
            image, //
            sides[side].x * size,
            sides[side].y * size,
          );
        });

        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        document.body.appendChild(canvas);
      });

    return () => {
      document.body.removeChild(canvas);
    };
  }, []);

  return <canvas className="canvas" ref={refCanvas}></canvas>;
};

export default Panorama;

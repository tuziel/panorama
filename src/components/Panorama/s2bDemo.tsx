import { useEffect, useRef } from 'react';
import { sphereImage2CubeImage } from '../../utils/geometry';
import imageUrl from '../../assets/demo1.jpg';

interface PanoramaProps {
  src: string;
}

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

    loadImage(imageUrl).then(([image]) => {
      Promise.all(
        [0, 1, 2, 3, 4, 5].map((face) =>
          sphereImage2CubeImage(image, face, size),
        ),
      ).then((images) => {
        images.forEach((image, i) => {
          context.drawImage(
            image,
            [1, 3, 2, 0, 1, 1][i] * size,
            [1, 1, 1, 1, 0, 2][i] * size,
          );
        });

        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        document.body.appendChild(canvas);
      });
    });

    return () => {
      document.body.removeChild(canvas);
    };
  }, []);

  return <canvas className="canvas" ref={refCanvas}></canvas>;
};

export default Panorama;

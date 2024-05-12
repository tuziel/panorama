import { useEffect, useRef } from 'react';
import { cubeImageToSphereImage, loadImage } from '@/utils/geometry';

import urlR from 'src/assets/demo1_R.jpg';
import urlL from 'src/assets/demo1_L.jpg';
import urlU from 'src/assets/demo1_U.jpg';
import urlD from 'src/assets/demo1_D.jpg';
import urlF from 'src/assets/demo1_F.jpg';
import urlB from 'src/assets/demo1_B.jpg';

function loadImages(srcs: string[]) {
  return Promise.all<HTMLImageElement>(srcs.map(loadImage));
}

const Panorama: React.FC = () => {
  const refCanvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = refCanvas.current!;
    const context = canvas.getContext('2d')!;
    const size = 300;
    canvas.width = size * 4;
    canvas.height = size * 2;

    loadImages([urlR, urlL, urlU, urlD, urlF, urlB].map(({ src }) => src)).then(
      ([r, l, u, d, f, b]) => {
        const image = cubeImageToSphereImage(r, l, u, d, f, b, size);
        context.putImageData(image, 0, 0);
      },
    );
  }, []);

  return <canvas className="canvas" ref={refCanvas}></canvas>;
};

export default Panorama;

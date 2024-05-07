import { useContext, useEffect, useRef } from 'react';
import PanoramaControlContext from 'src/context/PanoramaControlContext';
import { cubeImageToSphereImage } from 'src/utils/geometry';

import urlR from 'src/assets/demo1_R.jpg';
import urlL from 'src/assets/demo1_L.jpg';
import urlU from 'src/assets/demo1_U.jpg';
import urlD from 'src/assets/demo1_D.jpg';
import urlF from 'src/assets/demo1_F.jpg';
import urlB from 'src/assets/demo1_B.jpg';

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

const Panorama: React.FC = () => {
  const { src } = useContext(PanoramaControlContext);
  const refCanvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!src) return;

    const canvas = refCanvas.current!;
    const context = canvas.getContext('2d')!;
    const size = 300;
    canvas.width = size * 4;
    canvas.height = size * 2;

    loadImage(urlR, urlL, urlU, urlD, urlF, urlB)
      .then(([r, l, u, d, f, b]) =>
        cubeImageToSphereImage(r, l, u, d, f, b, size),
      )
      .then((image) => {
        context.drawImage(image, 0, 0);
      });
  }, [src]);

  return <canvas className="canvas" ref={refCanvas}></canvas>;
};

export default Panorama;

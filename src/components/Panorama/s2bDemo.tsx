import { useEffect, useRef } from 'react';
import { sphereImage2boxImage } from '../../utils/geometry';
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

    loadImage(imageUrl).then(([image]) => {
      sphereImage2boxImage(image, 0).then((frontImage) => {
        console.log(frontImage);
        const size = frontImage.width;
        canvas.width = canvas.height = size;
        context.drawImage(frontImage, 0, 0);

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

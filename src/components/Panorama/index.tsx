import { useEffect, useRef } from 'react';
import Scene from './scene';

import styles from './scene.module.css';

const Panorama: React.FC = () => {
  const refCanvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = refCanvas.current!;
    const scene = new Scene(canvas, {
      tileMapping: (level, side, x, y) => {
        return `/assets/demo1_${'RLUDFB'[side]}.jpg`;
      },
      tileSize: 1024,
      tiledImageSize: [0, 1024, 2048, 3584, 7296],
    });

    return () => {
      scene.destory();
    };
  }, []);

  return <canvas className={styles.canvas} ref={refCanvas}></canvas>;
};

export default Panorama;

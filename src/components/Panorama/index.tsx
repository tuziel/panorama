import { useEffect, useRef } from 'react';
import Scene from './scene';

import styles from './scene.module.css';

const Panorama: React.FC = () => {
  const refCanvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = refCanvas.current!;
    const scene = new Scene(canvas, {
      tileMapping: (level, side, x, y) => {
        const s = 'RLUDFB'[side];
        return `/assets/demo1_${s}.jpg`;
      },
    });

    return () => {
      scene.destory();
    };
  }, []);

  return <canvas className={styles.canvas} ref={refCanvas}></canvas>;
};

export default Panorama;

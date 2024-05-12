import * as THREE from 'three';
import { useEffect, useRef } from 'react';
import { G_SZIE } from '@/utils/consts';
import Scene from './scene';

import styles from './scene.module.css';

import urlR from '@/assets/demo1_R.jpg';
import urlL from '@/assets/demo1_L.jpg';
import urlU from '@/assets/demo1_U.jpg';
import urlD from '@/assets/demo1_D.jpg';
import urlF from '@/assets/demo1_F.jpg';
import urlB from '@/assets/demo1_B.jpg';

const Panorama: React.FC = () => {
  const refCanvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = refCanvas.current!;
    const scene = new Scene(canvas);

    const geometry = new THREE.SphereGeometry(G_SZIE, 180, 90);
    geometry.scale(1, 1, -1);
    const cuebTexture = new THREE.CubeTextureLoader().load(
      [urlR, urlL, urlD, urlU, urlF, urlB].map(({ src }) => src),
    );
    cuebTexture.flipY = true;
    const material = new THREE.MeshBasicMaterial({ envMap: cuebTexture });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    return () => {
      scene.destory();
    };
  }, []);

  return <canvas className={styles.canvas} ref={refCanvas}></canvas>;
};

export default Panorama;

import * as THREE from 'three';
import { useEffect, useRef } from 'react';
// import PanoramaControlContext from '@/context/PanoramaControlContext';
import { D90, G_SZIE } from '@/utils/consts';
import Scene from './scene';

import styles from './scene.module.css';

import urlR from '@/assets/demo1_R.jpg';
import urlL from '@/assets/demo1_L.jpg';
import urlU from '@/assets/demo1_U.jpg';
import urlD from '@/assets/demo1_D.jpg';
import urlF from '@/assets/demo1_F.jpg';
import urlB from '@/assets/demo1_B.jpg';

const Panorama: React.FC = () => {
  // const { src } = useContext(PanoramaControlContext);
  const refCanvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = refCanvas.current!;
    const scene = new Scene(canvas);

    const geometry = new THREE.SphereGeometry(G_SZIE, 180, 90);
    const cuebTexture = new THREE.CubeTextureLoader().load([
      urlR.src,
      urlL.src,
      urlD.src,
      urlU.src,
      urlF.src,
      urlB.src,
    ]);
    const material = new THREE.MeshBasicMaterial({
      side: THREE.BackSide,
      envMap: cuebTexture,
    });
    cuebTexture.flipY = true;
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.y = D90;
    scene.add(mesh);

    return () => {
      scene.destory();
    };
  }, []);

  // useEffect(() => {
  //   if (geometry.current) geometry.current.setTexture(src);
  // }, [src]);

  return <canvas className={styles.canvas} ref={refCanvas}></canvas>;
};

export default Panorama;

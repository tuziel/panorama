import * as THREE from 'three';
import { useEffect, useRef } from 'react';
// import PanoramaControlContext from 'src/context/PanoramaControlContext';
import { D90, G_SZIE } from 'src/utils/consts';
import Scene from './scene';

import './index.css';

import urlR from 'src/assets/demo1_R.jpg';
import urlL from 'src/assets/demo1_L.jpg';
import urlU from 'src/assets/demo1_U.jpg';
import urlD from 'src/assets/demo1_D.jpg';
import urlF from 'src/assets/demo1_F.jpg';
import urlB from 'src/assets/demo1_B.jpg';

const Panorama: React.FC = () => {
  // const { src } = useContext(PanoramaControlContext);
  const refCanvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = refCanvas.current!;
    const scene = new Scene(canvas);

    const geometry = new THREE.SphereGeometry(G_SZIE, 180, 90);
    const cuebTexture = new THREE.CubeTextureLoader().load([
      urlR,
      urlL,
      urlD,
      urlU,
      urlF,
      urlB,
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

  return <canvas className="canvas" ref={refCanvas}></canvas>;
};

export default Panorama;

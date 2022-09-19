import { useContext, useEffect, useRef } from 'react';
import { Geometry, Sphere } from './scene/geometry';
import Scene from './scene';

import './index.css';
import PanoramaControlContext from 'src/context/PanoramaControlContext';

const Panorama: React.FC = () => {
  const { src } = useContext(PanoramaControlContext);
  const refCanvas = useRef<HTMLCanvasElement>(null);
  const geometry = useRef<Geometry | null>(null);

  useEffect(() => {
    const canvas = refCanvas.current!;
    const scene = new Scene(canvas);

    geometry.current = new Sphere();
    const sphere = geometry.current.getMesh();
    scene.add(sphere);

    return () => {
      scene.destory();
    };
  }, []);

  useEffect(() => {
    if (geometry.current) geometry.current.setTexture(src);
  }, [src]);

  return <canvas className="canvas" ref={refCanvas}></canvas>;
};

export default Panorama;

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Geometry, Sphere } from './scene/geometry';
import Control, { SceneWheelEvent } from './scene/control';

import './index.css';

interface PanoramaProps {
  src: string;
}

interface Delta {
  deltaX: number;
  deltaY: number;
}

interface WinSize {
  width: number;
  height: number;
}

const size = 10;

const Panorama: React.FC<PanoramaProps> = ({ src }) => {
  const refCanvas = useRef<HTMLCanvasElement>(null);
  const geometry = useRef<Geometry | null>(null);

  useEffect(() => {
    const canvas = refCanvas.current!;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(90);
    const renderer = new THREE.WebGLRenderer({ canvas: canvas });
    let step: number;

    const control = new Control(canvas);
    control.on('drag', drag);
    control.on('dragInertia', drag);
    control.on('wheel', wheel);
    control.on('resize', updateSize);
    control.updateSize();

    geometry.current = new Sphere();
    const sphere = geometry.current.getMesh();
    scene.add(sphere);

    let rafId = -1;
    function raf(fn: () => void) {
      rafId = requestAnimationFrame(() => raf(fn));
      fn();
    }
    raf(() => renderer.render(scene, camera));

    function updateSize(size: WinSize) {
      const { width, height } = size;
      step = (camera.fov * (Math.PI / 180)) / height;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }

    function drag(ev: Delta) {
      const radius = size;
      const distance = Math.min(camera.position.z, size);
      const alpha = camera.fov * (Math.PI / 180);
      const beta = Math.asin((distance * Math.sin(alpha)) / radius);
      const deltaX = -ev.deltaY * step * (beta / alpha + 1);
      const deltaY = -ev.deltaX * step * (beta / alpha + 1);

      scene.rotation.x += deltaX;
      scene.rotation.x = Math.max(
        Math.PI * -0.5,
        Math.min(scene.rotation.x, Math.PI * 0.5),
      );
      scene.rotation.y += deltaY;
    }

    function wheel(ev: SceneWheelEvent) {
      const z = camera.position.z + ev.delta / 100;
      camera.position.z = Math.max(-6, Math.min(z, 20));
      camera.updateProjectionMatrix();
    }

    return () => {
      cancelAnimationFrame(rafId);
      control.destory();
    };
  }, []);

  useEffect(() => {
    if (geometry.current) geometry.current.setTexture(src);
  }, [src]);

  return <canvas className="canvas" ref={refCanvas}></canvas>;
};

export default Panorama;

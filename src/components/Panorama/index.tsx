import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import Sphere from './scene/geometry/sphere';
import Control, { SenceWheelEvent } from './scene/control';

import './index.css';

interface PanoramaProps {
  src: string;
}

interface Delta {
  deltaX: number;
  deltaY: number;
}

const size = 10;

const Panorama: React.FC<PanoramaProps> = ({ src }) => {
  const refCanvas = useRef<HTMLCanvasElement>(null);
  const geometry = useRef<Sphere | null>(null);

  useEffect(() => {
    const canvas = refCanvas.current!;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(90);
    const renderer = new THREE.WebGLRenderer({ canvas: canvas });
    let step: number;

    updateSize();
    window.addEventListener('resize', updateSize);

    const control = new Control(canvas);
    control.on('drag', drag);
    control.on('dragInertia', drag);
    control.on('wheel', wheel);

    geometry.current = new Sphere();
    const sphere = geometry.current.getMesh();
    sphere.rotation.x = 1 * Math.PI;
    sphere.rotation.y = 1.5 * Math.PI;
    scene.add(sphere);

    let rafId = -1;
    function raf(fn: () => void) {
      rafId = requestAnimationFrame(() => raf(fn));
      fn();
    }
    raf(() => renderer.render(scene, camera));

    function updateSize() {
      const width = window.innerWidth;
      const height = window.innerHeight;
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

    function wheel(ev: SenceWheelEvent) {
      const z = camera.position.z + ev.delta / 100;
      camera.position.z = Math.max(-6, Math.min(z, 20));
      camera.updateProjectionMatrix();
    }

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', updateSize);
      control.destory();
    };
  }, []);

  useEffect(() => {
    if (geometry.current) geometry.current.setTexture(src);
  }, [src]);

  return <canvas className="canvas" ref={refCanvas}></canvas>;
};

export default Panorama;

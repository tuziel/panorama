import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import './index.css';

interface PanoramaProps {
  src: string;
}

const Panorama: React.FC<PanoramaProps> = ({ src }) => {
  const refCanvas = useRef<HTMLCanvasElement>(null);
  const material = useRef<THREE.MeshBasicMaterial | null>(null);

  useEffect(() => {
    const canvas = refCanvas.current!;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(90);
    const renderer = new THREE.WebGLRenderer({ canvas: canvas });
    let step: number;
    updateSize();

    const geometry = new THREE.SphereGeometry(10, 180, 90);
    const texture = new THREE.TextureLoader().load('');
    texture.flipY = false;
    material.current = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.DoubleSide,
    });
    const sphere = new THREE.Mesh(geometry, material.current);
    scene.add(sphere);
    sphere.rotation.x = 1 * Math.PI;
    sphere.rotation.y = 1.5 * Math.PI;

    let rafId = -1;
    function raf(fn: () => void) {
      rafId = requestAnimationFrame(() => raf(fn));
      fn();
    }
    raf(() => {
      renderer.render(scene, camera);
    });

    function updateSize() {
      const width = window.innerWidth;
      const height = window.innerHeight;
      step = (camera.fov * (Math.PI / 180)) / height;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }

    let lastX: number;
    let lastY: number;

    function drag(x: number, y: number) {
      const radius = geometry.boundingSphere!.radius!;
      const distance = camera.position.z;
      const alpha = camera.fov * (Math.PI / 180);
      const beta = Math.asin((distance * Math.sin(alpha)) / radius);
      const deltaX = (lastY - y) * step * (beta / alpha + 1);
      const deltaY = (x - lastX) * step * (beta / alpha + 1);

      sphere.rotation.x += deltaX;
      sphere.rotation.x = Math.max(
        Math.PI * 0.5,
        Math.min(sphere.rotation.x, Math.PI * 1.5),
      );
      sphere.rotation.y += deltaY;

      lastX = x;
      lastY = y;
    }

    function ontouchstart(ev: TouchEvent) {
      canvas.removeEventListener('touchstart', ontouchstart);
      canvas.addEventListener('touchmove', ontouchmove);
      canvas.addEventListener('touchend', ontouchend);
      canvas.addEventListener('touchcancel', ontouchend);

      const touches = ev.touches;
      lastX = touches[touches.length - 1].clientX;
      lastY = touches[touches.length - 1].clientY;
    }

    function ontouchmove(ev: TouchEvent) {
      const touches = ev.touches;
      const { clientX, clientY } = touches[touches.length - 1];
      drag(clientX, clientY);
    }

    function ontouchend() {
      canvas.addEventListener('touchstart', ontouchstart);
      canvas.removeEventListener('touchmove', ontouchmove);
      canvas.removeEventListener('touchend', ontouchend);
      canvas.removeEventListener('touchcancel', ontouchend);
    }

    // function onscale() {
    //   //
    // }

    function onmousedown(ev: MouseEvent) {
      if (ev.button !== 0) return;
      canvas.removeEventListener('mousedown', onmousedown);
      window.addEventListener('mousemove', onmousemove, true);
      window.addEventListener('mouseup', onmouseup, true);
      window.addEventListener('blur', onmouseup, false);

      lastX = ev.clientX;
      lastY = ev.clientY;
    }

    function onmousemove(ev: MouseEvent) {
      drag(ev.clientX, ev.clientY);
    }

    function onmouseup() {
      canvas.addEventListener('mousedown', onmousedown);
      window.removeEventListener('mousemove', onmousemove, true);
      window.removeEventListener('mouseup', onmouseup, true);
      window.removeEventListener('blur', onmouseup, false);
    }

    function onwheel(ev: WheelEvent) {
      const z = camera.position.z + ev.deltaY / 100;
      camera.position.z = Math.max(-6, Math.min(z, 10));
      camera.updateProjectionMatrix();
    }

    window.addEventListener('resize', updateSize);
    canvas.addEventListener('touchstart', ontouchstart);
    canvas.addEventListener('mousedown', onmousedown);
    canvas.addEventListener('wheel', onwheel);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', updateSize);
      canvas.removeEventListener('touchstart', ontouchstart);
      canvas.removeEventListener('touchmove', ontouchmove);
      canvas.removeEventListener('touchend', ontouchend);
      canvas.removeEventListener('touchcancel', ontouchend);
      canvas.removeEventListener('mousedown', onmousedown);
      window.removeEventListener('mousemove', onmousemove, true);
      window.removeEventListener('mouseup', onmouseup, true);
      window.removeEventListener('blur', onmouseup, false);
      canvas.removeEventListener('wheel', onwheel);
    };
  }, []);

  useEffect(() => {
    const texture = new THREE.TextureLoader().load(src);
    texture.flipY = false;
    material.current?.setValues({ map: texture });
  }, [src]);

  return <canvas className="canvas" ref={refCanvas}></canvas>;
};

export default Panorama;

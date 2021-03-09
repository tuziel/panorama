import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import './App.css';

function App() {
  const app = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera();
    camera.position.z = 5;
    const renderer = new THREE.WebGLRenderer({ canvas: app.current! });
    updateSize();

    const geometry = new THREE.SphereGeometry(10, 180, 90);
    const imageUrl = require('./assets/demo1.jpg').default;
    const texture = new THREE.TextureLoader().load(imageUrl);
    texture.flipY = false;
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.DoubleSide,
    });
    const sphere = new THREE.Mesh(geometry, material);
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
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', updateSize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  return <canvas className="App" ref={app}></canvas>;
}

export default App;

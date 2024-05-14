import * as THREE from 'three';
import { D90, G_SZIE } from '@/utils/consts';
import type Geometry from './geometry';

export default class Sphere implements Geometry {
  private mesh: THREE.Mesh;
  private material: THREE.MeshBasicMaterial;

  constructor(src?: string) {
    const geometry = new THREE.SphereGeometry(G_SZIE, 180, 90, -D90);
    geometry.scale(1, 1, -1);
    this.material = new THREE.MeshBasicMaterial();
    this.mesh = new THREE.Mesh(geometry, this.material);
    if (src) this.setTexture(src);
  }

  getMesh() {
    return this.mesh;
  }

  setTexture(src: string) {
    const texture = new THREE.TextureLoader().load(src);
    this.material.setValues({ map: texture });
  }
}

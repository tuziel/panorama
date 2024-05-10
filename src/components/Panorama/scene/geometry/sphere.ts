import * as THREE from 'three';
import { D90, G_SZIE } from '@/utils/consts';
import type Geometry from './geometry';

export default class Sphere implements Geometry {
  private mesh: THREE.Mesh;
  private material: THREE.MeshBasicMaterial;

  constructor(src: string = '') {
    const geometry = new THREE.SphereGeometry(G_SZIE, 180, 90);
    this.material = new THREE.MeshBasicMaterial({ side: THREE.BackSide });
    this.setTexture(src);
    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.rotation.y = D90;
  }

  getMesh() {
    return this.mesh;
  }

  setTexture(src: string) {
    const texture = new THREE.TextureLoader().load(src);
    texture.matrixAutoUpdate = false;
    texture.matrix = new THREE.Matrix3().translate(-1, 0).scale(-1, 1);
    this.material.setValues({ map: texture });
  }
}

import * as THREE from 'three';
import { D180, D270, G_SZIE } from 'src/utils/consts';
import Geometry from './geometry';

export default class Sphere implements Geometry {
  private mesh: THREE.Mesh;
  private material: THREE.MeshBasicMaterial;

  constructor(src: string = '') {
    const geometry = new THREE.SphereGeometry(G_SZIE, 180, 90);
    this.material = new THREE.MeshBasicMaterial({ side: THREE.BackSide });
    this.setTexture(src);
    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.rotation.x = D180;
    this.mesh.rotation.y = D270;
  }

  getMesh() {
    return this.mesh;
  }

  setTexture(src: string) {
    const texture = new THREE.TextureLoader().load(src);
    texture.flipY = false;
    this.material.setValues({ map: texture });
  }
}

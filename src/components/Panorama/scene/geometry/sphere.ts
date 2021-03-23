import * as THREE from 'three';
import Geometry from '.';

const size = 10;

export default class Sphere implements Geometry {
  public mesh: THREE.Mesh;
  public material: THREE.MeshBasicMaterial;

  constructor(src: string = '') {
    const geometry = new THREE.SphereGeometry(size, 180, 90);
    this.material = new THREE.MeshBasicMaterial({ side: THREE.BackSide });
    this.setTexture(src);
    this.mesh = new THREE.Mesh(geometry, this.material);
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

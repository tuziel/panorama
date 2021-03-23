import * as THREE from 'three';

export default interface Geometry {
  mesh: THREE.Mesh;
  material: THREE.Material;

  getMesh(): THREE.Mesh;
  setTexture(src: string): void;
}

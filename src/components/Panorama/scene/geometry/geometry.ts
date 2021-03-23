import * as THREE from 'three';

export default interface Geometry {
  getMesh(): THREE.Mesh;
  setTexture(src: string): void;
}

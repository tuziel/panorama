import * as THREE from 'three';
import { times } from 'lodash';
import { Side, loadImage, sphereImageToCubeImage } from '@/utils/geometry';
import { D90, D180, D270, G_SZIE } from '@/utils/consts';
import type Geometry from './geometry';

const transfroms: ((plane: THREE.Object3D) => THREE.Object3D)[] = [
  (p) => p.translateX(G_SZIE).rotateY(D270),
  (p) => p.translateX(-G_SZIE).rotateY(D90),
  (p) => p.translateY(G_SZIE).rotateX(D90),
  (p) => p.translateY(-G_SZIE).rotateX(D270),
  (p) => p.translateZ(-G_SZIE),
  (p) => p.translateZ(G_SZIE).rotateY(D180),
];
export default class Cube implements Geometry {
  private mesh: THREE.Mesh;
  private materials: THREE.MeshBasicMaterial[];

  constructor(src: string = '') {
    const geometry = new THREE.PlaneGeometry(G_SZIE * 2, G_SZIE * 2);
    this.materials = times(6, () => new THREE.MeshBasicMaterial());
    this.mesh = new THREE.Mesh();
    this.materials
      .map((plane) => new THREE.Mesh(geometry, plane))
      .forEach((mesh, i) => this.mesh.add(transfroms[i](mesh)));

    if (src) this.setTexture(src);
  }

  getMesh() {
    return this.mesh;
  }

  setTexture(src: string) {
    loadImage(src).then((image) => {
      this.materials.forEach((material, side) => {
        const data = sphereImageToCubeImage(image, side);
        const texture = new THREE.Texture(data);
        material.setValues({ map: texture });
        texture.needsUpdate = true;
        material.needsUpdate = true;
      });
    });
  }
}

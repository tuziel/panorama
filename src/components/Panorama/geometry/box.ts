import * as THREE from 'three';
import { times } from 'lodash';
import { loadImage, sphereImageToCubeImage } from '@/utils/geometry';
import { G_SZIE } from '@/utils/consts';
import type Geometry from './geometry';

export default class Box implements Geometry {
  private mesh: THREE.Mesh;
  private materials: THREE.MeshBasicMaterial[];

  constructor(src?: string) {
    const geometry = new THREE.BoxGeometry(G_SZIE * 2, G_SZIE * 2, G_SZIE * 2);
    geometry.scale(1, 1, -1);
    this.materials = times(6, () => new THREE.MeshBasicMaterial());
    this.mesh = new THREE.Mesh(geometry, this.materials);
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

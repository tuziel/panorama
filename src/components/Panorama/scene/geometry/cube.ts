import { sphereImage2boxImage } from 'src/utils/geometry';
import * as THREE from 'three';
import Geometry from './geometry';

const SIZE = 10;
const D90 = Math.PI * 0.5;
const D180 = Math.PI;
const D270 = Math.PI * 1.5;
const transfroms: ((plane: THREE.Object3D) => THREE.Object3D)[] = [
  (p) => p.translateZ(-SIZE),
  (p) => p.translateZ(SIZE).rotateY(D180),
  (p) => p.translateX(SIZE).rotateY(D270),
  (p) => p.translateX(-SIZE).rotateY(D90),
  (p) => p.translateY(SIZE).rotateX(D90),
  (p) => p.translateY(-SIZE).rotateX(D270),
];

function loadImage(...srcs: string[]) {
  return Promise.all<HTMLImageElement>(
    srcs.map(
      (src) =>
        new Promise((resolve, reject) => {
          var image = new Image();
          image.onload = () => resolve(image);
          image.onerror = reject;
          image.src = src;
        }),
    ),
  );
}

export default class Cube implements Geometry {
  private mesh: THREE.Mesh;
  private planes: THREE.MeshBasicMaterial[];

  constructor(src: string = '') {
    const geometry = new THREE.PlaneGeometry(SIZE * 2, SIZE * 2);
    this.planes = new Array(6).fill(null).map(
      () =>
        new THREE.MeshBasicMaterial({
          map: new THREE.TextureLoader().load(''),
          side: THREE.FrontSide,
        }),
    );
    this.setTexture(src);
    this.mesh = new THREE.Mesh();
    this.planes
      .map((plane) => new THREE.Mesh(geometry, plane))
      .forEach((mesh, i) => this.mesh.add(transfroms[i](mesh)));
  }

  getMesh() {
    return this.mesh;
  }

  setTexture(src: string) {
    loadImage(src).then(([image]) => {
      [0, 1, 2, 3, 4, 5].forEach((face) =>
        sphereImage2boxImage(image, face).then((plane) => {
          const texture = new THREE.TextureLoader().load(plane.src);
          this.planes[face].setValues({ map: texture });
        }),
      );
    });
  }
}

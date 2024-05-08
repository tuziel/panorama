import * as THREE from 'three';
import { Side, sphereImageToCubeImage } from 'src/utils/geometry';
import { D90, D180, D270, G_SZIE } from 'src/utils/consts';
import Geometry from './geometry';

const transfroms: ((plane: THREE.Object3D) => THREE.Object3D)[] = [
  (p) => p.translateX(G_SZIE).rotateY(D270),
  (p) => p.translateX(-G_SZIE).rotateY(D90),
  (p) => p.translateY(G_SZIE).rotateX(D90),
  (p) => p.translateY(-G_SZIE).rotateX(D270),
  (p) => p.translateZ(-G_SZIE),
  (p) => p.translateZ(G_SZIE).rotateY(D180),
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
    const geometry = new THREE.PlaneGeometry(G_SZIE * 2, G_SZIE * 2);
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
      [
        Side.RIGHT,
        Side.LEFT,
        Side.TOP,
        Side.BOTTOM,
        Side.FRONT,
        Side.BACK,
      ].forEach((side) =>
        sphereImageToCubeImage(image, side).then((plane) => {
          const texture = new THREE.TextureLoader().load(plane.src);
          this.planes[side].setValues({ map: texture });
        }),
      );
    });
  }
}

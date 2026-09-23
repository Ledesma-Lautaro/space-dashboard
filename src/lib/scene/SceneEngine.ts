import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export type SceneEngineOptions = {
  onContextLost?: () => void;
  onContextRestored?: () => void;
};

type PlanetConfig = {
  name: string;
  radius: number; // radio de la esfera
  orbitRadius: number; // distancia al Sol
  speed: number; // radianes por frame
};

const PLANETS: PlanetConfig[] = [
  { name: "Mercurio", radius: 0.3, orbitRadius: 4.0, speed: 0.02 },
  { name: "Venus", radius: 0.45, orbitRadius: 5.5, speed: 0.015 },
  { name: "Tierra", radius: 0.5, orbitRadius: 7.0, speed: 0.012 },
  { name: "Marte", radius: 0.38, orbitRadius: 8.8, speed: 0.01 },
  { name: "Júpiter", radius: 1.1, orbitRadius: 12.0, speed: 0.0055 },
  { name: "Saturno", radius: 0.95, orbitRadius: 15.0, speed: 0.004 },
  { name: "Urano", radius: 0.7, orbitRadius: 17.5, speed: 0.0028 },
  { name: "Neptuno", radius: 0.68, orbitRadius: 20.0, speed: 0.0022 },
];

export class SceneEngine {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene: THREE.Scene;
  private readonly camera: THREE.PerspectiveCamera;
  private readonly controls: OrbitControls;

  private readonly sun: THREE.Mesh;
  private readonly orbitingBodies: { pivot: THREE.Group; speed: number }[] = [];

  private readonly canvas: HTMLCanvasElement;
  private readonly resizeObserver: ResizeObserver;
  private readonly options: SceneEngineOptions;

  private readonly syncSize = () => {
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    if (width === 0 || height === 0) return;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  };

  private readonly tick = () => {
    for (const body of this.orbitingBodies) {
      body.pivot.rotation.y += body.speed;
    }
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };

  private readonly onContextLost = (event: Event) => {
    event.preventDefault();
    this.renderer.setAnimationLoop(null);
    console.log("contexto WebGL perdido");
    this.options.onContextLost?.();
  };

  private readonly onContextRestored = () => {
    this.syncSize();
    this.renderer.setAnimationLoop(this.tick);
    this.options.onContextRestored?.();
  };

  constructor(canvas: HTMLCanvasElement, options: SceneEngineOptions = {}) {
    this.canvas = canvas;
    this.options = options;

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.scene = new THREE.Scene();

    // El Sol, en el origen
    this.sun = new THREE.Mesh(
      new THREE.SphereGeometry(2, 16, 12),
      new THREE.MeshBasicMaterial({ color: 0x4cdb6e, wireframe: true }),
    );
    this.scene.add(this.sun);

    // Un pivote + un planeta + una órbita por cada entrada de la tabla
    for (const config of PLANETS) {
      const pivot = new THREE.Group();
      this.scene.add(pivot);

      const planet = new THREE.Mesh(
        new THREE.SphereGeometry(config.radius, 12, 8),
        new THREE.MeshBasicMaterial({ color: 0x2fa352, wireframe: true }),
      );
      planet.position.x = config.orbitRadius;
      planet.name = config.name;
      pivot.add(planet);

      const curve = new THREE.EllipseCurve(
        0,
        0,
        config.orbitRadius,
        config.orbitRadius,
        0,
        Math.PI * 2,
        false,
        0,
      );
      const orbit = new THREE.LineLoop(
        new THREE.BufferGeometry().setFromPoints(curve.getPoints(128)),
        new THREE.LineBasicMaterial({ color: 0x2fa352 }),
      );
      orbit.rotation.x = -Math.PI / 2;
      this.scene.add(orbit);

      this.orbitingBodies.push({ pivot, speed: config.speed });
    }
    this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 200);
    this.camera.position.set(0, 12, 32);
    this.camera.lookAt(0, 0, 0);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;

    this.syncSize();

    this.resizeObserver = new ResizeObserver(this.syncSize);
    this.resizeObserver.observe(this.canvas);
    this.canvas.addEventListener("webglcontextlost", this.onContextLost);
    this.canvas.addEventListener(
      "webglcontextrestored",
      this.onContextRestored,
    );

    this.renderer.setAnimationLoop(this.tick);
  }

  dispose() {
    this.renderer.setAnimationLoop(null);
    this.controls.dispose();
    this.resizeObserver.disconnect();
    this.canvas.removeEventListener("webglcontextlost", this.onContextLost);
    this.canvas.removeEventListener(
      "webglcontextrestored",
      this.onContextRestored,
    );

    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
        object.geometry.dispose();
        const materials = Array.isArray(object.material)
          ? object.material
          : [object.material];
        for (const material of materials) material.dispose();
      }
    });
    this.renderer.dispose();
  }
}

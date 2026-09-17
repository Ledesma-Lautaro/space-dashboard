import * as THREE from "three";
export type SceneEngineOptions = {
  onContextLost?: () => void;
  onContextRestored?: () => void;
};

export class SceneEngine {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene: THREE.Scene;
  private readonly camera: THREE.PerspectiveCamera;
  private readonly cube: THREE.Mesh;
  private readonly geometry: THREE.BoxGeometry;
  private readonly material: THREE.MeshBasicMaterial;
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
    this.cube.rotation.y += 0.01;
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
    this.geometry = new THREE.BoxGeometry(1, 1, 1);
    this.material = new THREE.MeshBasicMaterial({
      color: 0x4cdb6e,
      wireframe: true,
    });

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.scene = new THREE.Scene();

    this.cube = new THREE.Mesh(this.geometry, this.material);
    this.scene.add(this.cube);

    this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
    this.camera.position.z = 5;

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
    this.resizeObserver.disconnect();
    this.canvas.removeEventListener("webglcontextlost", this.onContextLost);
    this.canvas.removeEventListener(
      "webglcontextrestored",
      this.onContextRestored,
    );

    this.geometry.dispose();
    this.material.dispose();
    this.renderer.dispose();
    console.log("engine destruido");
  }
}

import * as THREE from "three";
import gsap from "gsap";
import type { CameraMode } from "$lib/types";

type CameraRigOptions = {
  rootGroup: THREE.Group;
  viewportWidth: number;
  viewportHeight: number;

  fov?: number;
  near?: number;
  far?: number;

  initialPosition?: THREE.Vector3 | { x: number; y: number; z: number };
};

export class CameraRig {
  public camera: THREE.PerspectiveCamera;

  private readonly ZOOM_PERCENTAGE = 0.7;

  private targetLookAt: THREE.Vector3;
  private rootGroup: THREE.Group;

  private readonly MOVE_DURATION = 0.6;
  private readonly TILT_DURATION = 0.6;

  constructor(camera: THREE.PerspectiveCamera, rootGroup: THREE.Group);
  constructor(options: CameraRigOptions);
  constructor(
    cameraOrOptions: THREE.PerspectiveCamera | CameraRigOptions,
    rootGroup?: THREE.Group,
  ) {
    if (cameraOrOptions instanceof THREE.PerspectiveCamera) {
      if (!rootGroup) {
        throw new Error(
          "CameraRig: rootGroup is required when passing a camera.",
        );
      }
      this.camera = cameraOrOptions;
      this.rootGroup = rootGroup;
    } else {
      const {
        rootGroup: rg,
        viewportWidth,
        viewportHeight,
        fov = 50,
        near = 0.1,
        far = 2000,
        initialPosition = { x: 0, y: 0, z: 10 },
      } = cameraOrOptions;

      this.rootGroup = rg;

      const w = Math.max(viewportWidth, 1);
      const h = Math.max(viewportHeight, 1);
      const aspect = w / h;

      this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

      if (initialPosition instanceof THREE.Vector3) {
        this.camera.position.copy(initialPosition);
      } else {
        this.camera.position.set(
          initialPosition.x,
          initialPosition.y,
          initialPosition.z,
        );
      }
    }

    this.targetLookAt = new THREE.Vector3(0, 0, 0);
    this.camera.lookAt(this.targetLookAt);
    this.camera.updateProjectionMatrix();
  }

  public resize(viewportWidth: number, viewportHeight: number) {
    const w = Math.max(viewportWidth, 1);
    const h = Math.max(viewportHeight, 1);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  public focusOverview(object?: THREE.Object3D) {
    const box = new THREE.Box3().setFromObject(object ?? this.rootGroup);
    this.zoomToBox(box, "overview");
  }

  public focusOnObject(object: THREE.Object3D, mode: CameraMode) {
    const box = new THREE.Box3().setFromObject(object);
    this.zoomToBox(box, mode);
  }

  public update(_deltaSeconds: number) {
    this.camera.lookAt(this.targetLookAt);
  }

  private zoomToBox(box: THREE.Box3, mode: CameraMode) {
    const center = new THREE.Vector3();
    box.getCenter(center);

    const size = new THREE.Vector3();
    box.getSize(size);

    const eps = 1e-6;
    size.x = Math.max(size.x, eps);
    size.y = Math.max(size.y, eps);
    size.z = Math.max(size.z, eps);

    // 1) Distancia para encuadrar (sin tilt del mundo)
    const fovRad = THREE.MathUtils.degToRad(this.camera.fov);
    const halfTan = Math.tan(fovRad / 2);

    const fitHeightDistance = size.y / 2 / halfTan;
    const fitWidthDistance = size.x / 2 / (halfTan * this.camera.aspect);

    let distance = Math.max(fitHeightDistance, fitWidthDistance);
    distance = distance / this.ZOOM_PERCENTAGE;

    // 2) Tilt = pitch de cámara (rotación X)
    const pitch = this.pitchRadForMode(mode);

    // 3) Colocamos la cámara “detrás” del centro según el pitch.
    const dirToCamera = new THREE.Vector3(
      0,
      -Math.sin(pitch),
      Math.cos(pitch),
    ).normalize();
    const targetPos = center.clone().add(dirToCamera.multiplyScalar(distance));

    // 4) Animaciones: posición + objetivo + pitch de cámara
    gsap.to(this.camera.position, {
      x: targetPos.x,
      y: targetPos.y,
      z: targetPos.z,
      duration: this.MOVE_DURATION,
      ease: "power1.inOut",
      overwrite: "auto",
    });

    gsap.to(this.targetLookAt, {
      x: center.x,
      y: center.y,
      z: center.z,
      duration: this.MOVE_DURATION,
      ease: "power1.inOut",
      overwrite: "auto",
    });

    gsap.to(this.camera.rotation, {
      x: pitch,
      duration: this.TILT_DURATION,
      ease: "power1.inOut",
      overwrite: "auto",
    });
  }

  private pitchRadForMode(mode: CameraMode): number {
    const pitchByMode: Record<CameraMode, number> = {
      overview: 0,
      modelFocus: -THREE.MathUtils.degToRad(-30),
      layerFocus: -THREE.MathUtils.degToRad(-50),
      neuronFocus: -THREE.MathUtils.degToRad(-60),
    };
    return pitchByMode[mode];
  }
}

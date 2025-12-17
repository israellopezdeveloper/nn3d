import * as THREE from "three";
import gsap from "gsap";
import type { CameraMode } from "./types.ts";

type CameraRigOptions = {
  rootGroup: THREE.Group;
  viewportWidth: number;
  viewportHeight: number;
  frustumSize?: number;
  near?: number;
  far?: number;
  initialPosition?: THREE.Vector3 | { x: number; y: number; z: number };
};

export class CameraRig {
  public camera: THREE.OrthographicCamera;

  private readonly ZOOM_PERCENTAGE: number = 0.9;

  private targetLookAt: THREE.Vector3;
  private rootGroup: THREE.Group;

  // Duraciones de las animaciones (en segundos)
  private readonly MOVE_DURATION: number = 0.6;
  private readonly ZOOM_DURATION: number = 0.6;
  private readonly TILT_DURATION: number = 0.6;

  // Tamaño del frustum ortográfico base (alto). El ancho se deriva del aspect.
  private frustumSize: number;

  constructor(camera: THREE.OrthographicCamera, rootGroup: THREE.Group);
  constructor(options: CameraRigOptions);
  constructor(
    cameraOrOptions: THREE.OrthographicCamera | CameraRigOptions,
    rootGroup?: THREE.Group,
  ) {
    if (cameraOrOptions instanceof THREE.OrthographicCamera) {
      if (!rootGroup) {
        throw new Error(
          "CameraRig: rootGroup is required when passing a camera.",
        );
      }
      this.camera = cameraOrOptions;
      this.rootGroup = rootGroup;
      this.frustumSize = this.camera.top - this.camera.bottom;
    } else {
      const {
        rootGroup: rg,
        viewportWidth,
        viewportHeight,
        frustumSize = 10,
        near = 0.1,
        far = 1000,
        initialPosition = { x: 0, y: 0, z: 10 },
      } = cameraOrOptions;

      this.rootGroup = rg;
      this.frustumSize = frustumSize;

      const aspect = Math.max(viewportWidth, 1) / Math.max(viewportHeight, 1);
      this.camera = new THREE.OrthographicCamera(
        (-frustumSize * aspect) / 2,
        (frustumSize * aspect) / 2,
        frustumSize / 2,
        -frustumSize / 2,
        near,
        far,
      );

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
  }

  /**
   * Actualiza el frustum ortográfico en base al tamaño del viewport.
   * Importante: el renderer sigue siendo responsable del setSize().
   */
  public resize(viewportWidth: number, viewportHeight: number) {
    const w = Math.max(viewportWidth, 1);
    const h = Math.max(viewportHeight, 1);
    const aspect = w / h;

    this.camera.left = (-this.frustumSize * aspect) / 2;
    this.camera.right = (this.frustumSize * aspect) / 2;
    this.camera.top = this.frustumSize / 2;
    this.camera.bottom = -this.frustumSize / 2;

    this.camera.updateProjectionMatrix();
  }

  public focusOverview(object?: THREE.Object3D) {
    if (object) {
      const box = new THREE.Box3().setFromObject(object);
      this.zoomToBox(box, "overview");
      return;
    }

    const box = new THREE.Box3().setFromObject(this.rootGroup);
    this.zoomToBox(box, "overview");
  }

  public focusOnObject(object: THREE.Object3D, mode: CameraMode) {
    const box = new THREE.Box3().setFromObject(object);
    this.zoomToBox(box, mode);
  }

  public update(_deltaSeconds: number) {
    // Mantener el lookAt al target interpolado
    this.camera.lookAt(this.targetLookAt);
  }

  private zoomToBox(box: THREE.Box3, mode: CameraMode) {
    const center = new THREE.Vector3();
    box.getCenter(center);

    const size = new THREE.Vector3();
    box.getSize(size);

    const eps = 0.00001;
    size.x = Math.max(size.x, eps);
    size.y = Math.max(size.y, eps);

    const frustumWidth = this.camera.right - this.camera.left;
    const frustumHeight = this.camera.top - this.camera.bottom;

    const zoomX = frustumWidth / size.x;
    const zoomY = frustumHeight / size.y;

    const newZoom = Math.min(zoomX, zoomY) * this.ZOOM_PERCENTAGE;

    this.setTilt(box, mode);

    // Animar posición X/Y de la cámara hacia el centro de la caja
    gsap.to(this.camera.position, {
      x: center.x,
      y: center.y,
      duration: this.MOVE_DURATION,
      ease: "power1.inOut",
      overwrite: "auto",
      onUpdate: () => this.camera.lookAt(center),
    });

    // Animar zoom de la cámara
    gsap.to(this.camera, {
      zoom: newZoom,
      duration: this.ZOOM_DURATION,
      ease: "power3.inOut",
      overwrite: "auto",
      onUpdate: () => {
        this.camera.updateProjectionMatrix();
        this.camera.lookAt(center);
      },
    });

    // Animar también el punto al que mira (lookAt) para evitar saltos bruscos
    gsap.to(this.targetLookAt, {
      x: center.x,
      y: center.y,
      z: center.z,
      duration: this.MOVE_DURATION,
      ease: "power1.inOut",
      overwrite: "auto",
    });
  }

  private setTilt(target: THREE.Box3 | null, mode: CameraMode) {
    const tiltByMode: Record<CameraMode, number> = {
      overview: 0,
      modelFocus: 30,
      layerFocus: 50,
      neuronFocus: 60,
    };

    const targetRad = THREE.MathUtils.degToRad(tiltByMode[mode]);

    // Animamos la rotación en X del rootGroup para simular el tilt
    gsap.to(this.rootGroup.rotation, {
      x: targetRad,
      duration: this.TILT_DURATION,
      ease: "power1.inOut",
      overwrite: "auto",
      onUpdate: () => {
        if (target) {
          const center = new THREE.Vector3();
          target.getCenter(center);
          this.camera.lookAt(center);
        }
      },
      onComplete: () => {
        if (!target) return;
        const center = new THREE.Vector3();
        target.getCenter(center);
        this.camera.lookAt(center);
      },
    });
  }
}

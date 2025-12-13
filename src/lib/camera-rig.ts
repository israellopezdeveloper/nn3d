import * as THREE from 'three';
import gsap from 'gsap';

export class CameraRig {
  public camera: THREE.OrthographicCamera;

  private ZOOM_PERCENTAGE: number = 0.9;

  private targetLookAt: THREE.Vector3;
  private rootGroup: THREE.Group;

  // Duraciones de las animaciones (en segundos)
  private MOVE_DURATION: number = 0.6;
  private ZOOM_DURATION: number = 0.6;
  private TILT_DURATION: number = 0.6;

  constructor(camera: THREE.OrthographicCamera, root: THREE.Group) {
    this.camera = camera;
    this.targetLookAt = new THREE.Vector3(0, 0, 0);
    this.rootGroup = root;
  }

  public focusOverview(object?: THREE.Object3D) {
    if (object) {
      const box = new THREE.Box3().setFromObject(object);
      this.zoomToBox(box);
      return;
    }

    const box = new THREE.Box3().setFromObject(this.rootGroup);
    this.zoomToBox(box);
  }

  public focusOnObject(object: THREE.Object3D) {
    const box = new THREE.Box3().setFromObject(object);
    this.zoomToBox(box);
  }

  public update(_deltaSeconds: number) {
    // Mantener el lookAt al target interpolado
    this.camera.lookAt(this.targetLookAt);
  }

  public zoomToBox(box: THREE.Box3) {
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

    // Animar posición X/Y de la cámara hacia el centro de la caja
    gsap.to(this.camera.position, {
      x: center.x,
      y: center.y,
      duration: this.MOVE_DURATION,
      ease: 'power1.inOut',
      overwrite: 'auto'
    });

    // Animar también el punto al que mira (lookAt) para evitar saltos bruscos
    gsap.to(this.targetLookAt, {
      x: center.x,
      y: center.y,
      z: center.z,
      duration: this.MOVE_DURATION,
      ease: 'power1.inOut',
      overwrite: 'auto'
    });

    // Animar zoom de la cámara
    gsap.to(this.camera, {
      zoom: newZoom,
      duration: this.ZOOM_DURATION,
      ease: 'power3.inOut',
      overwrite: 'auto',
      onUpdate: () => {
        this.camera.updateProjectionMatrix();
      }
    });
  }

  public setTilt(deg: number) {
    const targetRad = THREE.MathUtils.degToRad(deg);

    // Animamos la rotación en X del rootGroup para simular el tilt
    gsap.to(this.rootGroup.rotation, {
      x: targetRad,
      duration: this.TILT_DURATION,
      ease: 'power1.inOut',
      overwrite: 'auto'
    });
  }
}

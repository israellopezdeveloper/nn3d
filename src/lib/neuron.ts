import * as THREE from "three";

export class Neuron extends THREE.Group {
  private core: THREE.Mesh;
  private fogSphere: THREE.Mesh;
  private inner: THREE.Mesh;

  // Estado de hover
  private _isHovered = false;

  constructor(
    neuronOutColor: THREE.Color | number = 0x0033ff,
    neuronInColor: THREE.Color | number = 0x66ccff,
    neuronFogColor: THREE.Color | number = 0x0088ff,
  ) {
    super();

    // -------------------------------
    // Esfera principal (núcleo)
    // -------------------------------
    const coreGeo = new THREE.SphereGeometry(0.35, 20, 20);
    const coreMat = new THREE.MeshPhysicalMaterial({
      color: neuronOutColor,
      metalness: 0.85,
      roughness: 0.15,
      transparent: true,
      opacity: 0.9,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
      emissive: neuronOutColor,
      emissiveIntensity: 1.5,
    });

    this.core = new THREE.Mesh(coreGeo, coreMat);
    this.add(this.core);

    // -------------------------------
    // Neblina exterior
    // -------------------------------
    const fogGeo = new THREE.SphereGeometry(0.55, 20, 20);
    const fogMat = new THREE.MeshBasicMaterial({
      color: neuronFogColor,
      transparent: true,
      opacity: 0.02,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });

    this.fogSphere = new THREE.Mesh(fogGeo, fogMat);
    this.add(this.fogSphere);

    // -------------------------------
    // Núcleo interno (esfera secundaria)
    // -------------------------------
    const innerGeo = new THREE.SphereGeometry(0.08, 10, 10);
    const innerMat = new THREE.MeshPhysicalMaterial({
      color: neuronInColor,
      emissive: neuronInColor,
      emissiveIntensity: 2,
      metalness: 0.8,
      roughness: 0.3,
      transparent: true,
      opacity: 0.3,
    });

    this.inner = new THREE.Mesh(innerGeo, innerMat);
    this.inner.position.set(-0.2, -0.1, -0.15);
    this.add(this.inner);
  }

  /**
   * Actualiza la animación de la neurona.
   * @param timeMs Tiempo en milisegundos (performance.now() o similar)
   */
  public update(timeMs: number): void {
    const t = timeMs * 0.001; // a segundos

    // Movimiento núcleo interno (órbita suave)
    this.inner.position.x = -0.15 * Math.cos(t * 3.3);
    this.inner.position.y = -0.15 * Math.sin(t * 3.0);
    this.inner.position.z = -0.15 * Math.sin(t * 3.6);

    // Opacidad de la neblina: un poco más fuerte en hover
    const fogMat = this.fogSphere.material as THREE.MeshBasicMaterial;
    const baseFogOpacity = 0.06;
    const hoverFogOpacity = 0.14;
    fogMat.opacity = this._isHovered ? hoverFogOpacity : baseFogOpacity;
  }

  /** Para raycasting, si quieres seguir usando esto */
  public getMesh(): THREE.Mesh {
    return this.fogSphere;
  }

  /** Hover ON: aumenta brillo y niebla (a través de update) */
  public hoverIn(): void {
    this._isHovered = true;
  }

  /** Hover OFF: vuelve a valores normales */
  public hoverOut(): void {
    this._isHovered = false;
  }
}

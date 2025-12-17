import * as THREE from "three";
import gsap from "gsap";
import type { NeuronNode } from "./types.ts";

export class Neuron extends THREE.Group {
  private core: THREE.Mesh;
  private fogSphere: THREE.Mesh;
  private inner: THREE.Mesh;

  private readonly outColor: THREE.Color;
  private readonly inColor: THREE.Color;
  private readonly fogColor: THREE.Color;

  private idleTl: gsap.core.Timeline | null = null;

  declare userData: { node?: NeuronNode } & THREE.Object3D["userData"];

  constructor(
    node: NeuronNode,
    neuronOutColor: THREE.Color | number = 0x0033ff,
    neuronInColor: THREE.Color | number = 0x66ccff,
    neuronFogColor: THREE.Color | number = 0x0088ff,
  ) {
    super();

    this.name = `Neuron:${node.id}`;
    this.userData.node = node;

    this.outColor =
      neuronOutColor instanceof THREE.Color
        ? neuronOutColor.clone()
        : new THREE.Color(neuronOutColor);
    this.inColor =
      neuronInColor instanceof THREE.Color
        ? neuronInColor.clone()
        : new THREE.Color(neuronInColor);
    this.fogColor =
      neuronFogColor instanceof THREE.Color
        ? neuronFogColor.clone()
        : new THREE.Color(neuronFogColor);

    // -------------------------------
    // Esfera principal (núcleo)
    // -------------------------------
    const coreGeo = new THREE.SphereGeometry(0.35, 20, 20);
    const coreMat = new THREE.MeshPhysicalMaterial({
      color: this.outColor,
      metalness: 0.85,
      roughness: 0.15,
      transparent: true,
      opacity: 0.7,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
      emissive: this.outColor,
      emissiveIntensity: 1.5,
    });

    this.core = new THREE.Mesh(coreGeo, coreMat);
    this.add(this.core);

    // -------------------------------
    // Neblina exterior
    // -------------------------------
    const fogGeo = new THREE.SphereGeometry(0.55, 20, 20);
    const fogMat = new THREE.MeshBasicMaterial({
      color: this.fogColor,
      transparent: true,
      opacity: 0.06,
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
      color: this.inColor,
      emissive: this.inColor,
      emissiveIntensity: 2,
      metalness: 0.8,
      roughness: 0.3,
      transparent: true,
      opacity: 0.9,
    });

    this.inner = new THREE.Mesh(innerGeo, innerMat);
    this.add(this.inner);

    // Arranca animaciones idle
    this.startIdleAnimation();
  }

  public getUserData(): NeuronNode | undefined {
    return this.userData.node;
  }

  /** Para raycasting */
  public getMesh(): THREE.Mesh {
    return this.fogSphere;
  }

  public hoverIn(): void {
    const fogMat = this.fogSphere.material as THREE.MeshBasicMaterial;
    gsap.to(fogMat, {
      opacity: 0.14,
      duration: 0.18,
      ease: "power2.out",
      overwrite: true,
    });
  }

  public hoverOut(): void {
    const fogMat = this.fogSphere.material as THREE.MeshBasicMaterial;
    gsap.to(fogMat, {
      opacity: 0.06,
      duration: 0.22,
      ease: "power2.out",
      overwrite: true,
    });
  }

  /**
   * Importante: llama a esto cuando elimines la neurona del scene graph
   * para evitar tweens vivos (memory leaks).
   */
  public dispose(): void {
    this.idleTl?.kill();
    this.idleTl = null;

    // opcional: también puedes matar tweens sueltos por seguridad
    gsap.killTweensOf(this.inner.position);
    gsap.killTweensOf(this.fogSphere.material as THREE.MeshBasicMaterial);
  }

  // ----------------- private -----------------

  private startIdleAnimation(): void {
    // Si reinicias, limpia
    this.idleTl?.kill();

    // Timeline infinito
    this.idleTl = gsap.timeline({ repeat: -1, yoyo: true });

    // Movimiento "órbita" aproximado (3 ejes)
    // Usamos duraciones distintas para que no sea repetitivo
    this.idleTl.to(
      this.inner.position,
      {
        x: 0.3,
        duration: 1.2,
        ease: "sine.inOut",
      },
      0,
    );

    this.idleTl.to(
      this.inner.position,
      {
        y: 0.3,
        duration: 0.9,
        ease: "sine.inOut",
      },
      0,
    );

    this.idleTl.to(
      this.inner.position,
      {
        z: 0.3,
        duration: 1.5,
        ease: "sine.inOut",
      },
      0,
    );

    // Pequeño “breathing” del fog (sin hover)
    const fogMat = this.fogSphere.material as THREE.MeshBasicMaterial;
    this.idleTl.to(
      fogMat,
      {
        opacity: 0.08,
        duration: 1.0,
        ease: "sine.inOut",
        // Importante: si está hover, el hover manda y este tween no debe pelear
        // pero como usamos overwrite en hoverIn/out, se mantiene controlado.
      },
      0,
    );
  }
}

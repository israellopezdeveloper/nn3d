import * as THREE from "three";
import gsap from "gsap";
import type { NeuronNode } from "$lib/types";
import { Hoverable } from "$lib/objects/InteractiveObject";

export class Neuron extends Hoverable {
  private core: THREE.Mesh;
  private fogSphere: THREE.Mesh;
  private inner: THREE.Mesh;

  private readonly outColor: THREE.Color;
  private readonly inColor: THREE.Color;
  private readonly fogColor: THREE.Color;

  private idleTl: gsap.core.Timeline | null = null;

  declare userData: NeuronNode;

  constructor(
    node: NeuronNode,
    neuronOutColor: THREE.Color | number = 0x0033ff,
    neuronInColor: THREE.Color | number = 0x66ccff,
    neuronFogColor: THREE.Color | number = 0x0088ff,
    highlightColor: THREE.Color | number = 0x00aaff,
  ) {
    super(highlightColor);

    this.name = node.id;
    this.userData = node;

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

  public getUserData(): NeuronNode {
    return this.userData;
  }

  public onHoverIn(): void {
    const fogMat = this.fogSphere.material as THREE.MeshBasicMaterial;
    gsap.to(fogMat, {
      opacity: 0.14,
      duration: 0.18,
      ease: "power2.out",
      overwrite: true,
    });
  }

  public onHoverOut(): void {
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
    this.idleTl?.kill();

    const base = this.inner.position.clone();

    const state = { t: 0 }; // ángulo en radianes

    this.idleTl = gsap.timeline({ repeat: -1 });

    this.idleTl.to(state, {
      t: Math.PI * 2,
      duration: 6, // velocidad de órbita
      ease: "none", // importante: velocidad constante
      repeat: -1,
      onUpdate: () => {
        const r = 0.3; // radio

        this.inner.position.set(
          base.x + Math.cos(state.t * 2) * r,
          base.y + Math.sin(state.t * 3) * r, // leve bobbing vertical opcional
          base.z + Math.sin(state.t * 4) * r,
        );
      },
    });

    // breathing del fog sincronizado pero independiente
    const fogMat = this.fogSphere.material as THREE.MeshBasicMaterial;
    this.idleTl.to(
      fogMat,
      {
        opacity: 0.08,
        duration: 1.0,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      },
      0,
    );
  }
}

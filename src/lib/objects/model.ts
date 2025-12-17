// Model.ts
import * as THREE from "three";
import gsap from "gsap";

import type { ModelNode, LayerNode } from "$lib/types";
import { Layer } from "$lib/objects/layer";
import { Neuron } from "$lib/objects/neuron";
import { Hoverable } from "$lib/objects/InteractiveObject";

export class Model extends Hoverable {
  public nnLayers: Layer[] = [];
  public nnNeurons: Neuron[] = [];

  // líneas entre capas
  public lines: THREE.LineSegments<
    THREE.BufferGeometry,
    THREE.LineBasicMaterial
  > | null = null;

  private readonly neuronSpacing: number;
  private readonly layerSpacing: number;

  public readonly neuronOutColor: THREE.Color | number;
  public readonly neuronInColor: THREE.Color | number;
  public readonly neuronFogColor: THREE.Color | number;

  private readonly lineColor: THREE.Color | number;

  // lines animation
  private linesMaterial: THREE.LineBasicMaterial | null = null;
  private linesColorTween: gsap.core.Tween | null = null;

  // Pulse tuning (feel free to tweak)
  private readonly pulseDurationSec = 1.1;
  private readonly pulseBoostToWhite = 0.15; // 0..1 (higher = brighter)
  private readonly pulseClampMin = 0.12; // 0..1
  private readonly pulseClampMax = 0.7; // 0..1

  declare userData: ModelNode;

  constructor(
    node: ModelNode,
    neuronSpacing: number,
    layerSpacing: number,
    neuronOutColor: THREE.Color | number = 0x0033ff,
    neuronInColor: THREE.Color | number = 0x66ccff,
    neuronFogColor: THREE.Color | number = 0x0088ff,
    lineColor: THREE.Color | number = 0x6ae3ff,
    highlightColor: THREE.Color | number = 0x00aaff,
  ) {
    super(highlightColor);

    this.name = node.id;
    this.userData = node;

    this.neuronSpacing = neuronSpacing;
    this.layerSpacing = layerSpacing;

    this.neuronOutColor = neuronOutColor;
    this.neuronInColor = neuronInColor;
    this.neuronFogColor = neuronFogColor;

    this.lineColor = lineColor;

    // Highlight
    this.add(this.highlight);

    const layerNodes = node.layers ?? [];

    // 1) Calcula maxNeurons
    const maxNeurons = this.computeMaxNeurons(layerNodes);

    // 2) Crea layers (cada una recibe maxNeurons + neuronSpacing)
    for (const ln of layerNodes) {
      const layer = new Layer(
        ln,
        maxNeurons,
        this.neuronSpacing,
        this.neuronOutColor,
        this.neuronInColor,
        this.neuronFogColor,
      );
      this.nnLayers.push(layer);
      this.add(layer);

      this.nnNeurons.push(...layer.nn_neurons);
    }

    // 3) Layout de capas (apiladas)
    this.layoutLayersStacked();

    // 4) Crea líneas all-to-all entre capas
    if (this.nnLayers.length >= 2) {
      this.lines = this.buildAllToAllConnections(this.nnLayers);
      this.add(this.lines);
    }

    this.fitHighlightToContent();
  }

  onHoverIn(): void {
    this.highlight.visible = true;
    this.highlight.castShadow = false;
    this.highlight.receiveShadow = false;
  }

  onHoverOut(): void {
    this.highlight.visible = false;
    this.highlight.castShadow = false;
    this.highlight.receiveShadow = false;
  }

  getUserData(): ModelNode {
    return this.userData;
  }

  /**
   * Call this when removing the model from the scene to prevent leaks.
   */
  public dispose(): void {
    this.linesColorTween?.kill();
    this.linesColorTween = null;

    if (this.lines) {
      this.lines.geometry.dispose();
      this.lines.material.dispose();
      this.lines = null;
    }

    this.linesMaterial = null;
  }

  // ----------------- private helpers -----------------

  private computeMaxNeurons(layerNodes: LayerNode[]): number {
    let max = 1;
    for (const ln of layerNodes) {
      max = Math.max(max, ln.neurons?.length ?? 0);
    }
    return Math.max(1, max);
  }

  private layoutLayersStacked(): void {
    const n = this.nnLayers.length;
    if (n === 0) return;

    const totalHeight = (n - 1) * this.layerSpacing;
    const topY = totalHeight / 2;

    for (let i = 0; i < n; i++) {
      const y = topY - i * this.layerSpacing;
      this.nnLayers[i].position.set(0, y, 0);
    }
  }

  private buildAllToAllConnections(
    layers: Layer[],
  ): THREE.LineSegments<THREE.BufferGeometry, THREE.LineBasicMaterial> {
    // contamos cuántos segmentos vamos a crear
    let segments = 0;
    for (let i = 0; i < layers.length - 1; i++) {
      const a = layers[i].nn_neurons.length;
      const b = layers[i + 1].nn_neurons.length;
      segments += a * b;
    }

    // cada segmento = 2 puntos = 6 floats (x,y,z) * 2
    const positions = new Float32Array(segments * 2 * 3);

    const pA = new THREE.Vector3();
    const pB = new THREE.Vector3();

    let offset = 0;

    for (let i = 0; i < layers.length - 1; i++) {
      const layerA = layers[i];
      const layerB = layers[i + 1];

      for (const neuronA of layerA.nn_neurons) {
        neuronA.getWorldPosition(pA);

        for (const neuronB of layerB.nn_neurons) {
          neuronB.getWorldPosition(pB);

          // Pasamos a coordenadas locales del Model (porque la geometría vive en este grupo)
          this.worldToLocal(pA);
          this.worldToLocal(pB);

          positions[offset++] = pA.x;
          positions[offset++] = pA.y;
          positions[offset++] = pA.z;

          positions[offset++] = pB.x;
          positions[offset++] = pB.y;
          positions[offset++] = pB.z;
        }
      }
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geom.computeBoundingSphere();

    const mat = new THREE.LineBasicMaterial({
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
      color: this.lineColor,
    });

    // ✅ keep reference to animate color
    this.linesMaterial = mat;

    const lines = new THREE.LineSegments(geom, mat);
    lines.name = `${this.name}:connections`;

    // ✅ start pulse animation
    this.startLinesPulseAnimation();

    return lines;
  }

  /**
   * Pulse style:
   * baseColor -> (complementaryColor boosted towards white) -> baseColor ...
   * with clamp to avoid "too dark" or "too blown out" values.
   */
  private startLinesPulseAnimation(): void {
    if (!this.linesMaterial) return;

    // Prevent duplicated tweens if called again
    this.linesColorTween?.kill();

    // Base color (as linear 0..1 components)
    const base = new THREE.Color(this.linesMaterial.color);

    // Complementary (opposite)
    const comp = new THREE.Color(
      Math.min(base.r * 1.001, 1),
      Math.min(base.g * 1.001, 1),
      Math.min(base.b * 1.001, 1),
    );

    // Boost towards white for a nicer "pulse" (instead of harsh inverse)
    const boosted = comp
      .clone()
      .lerp(new THREE.Color(1, 1, 1), this.pulseBoostToWhite);

    // Clamp to keep it visually pleasant / consistent
    const target = new THREE.Color(
      this.clamp01(boosted.r, this.pulseClampMin, this.pulseClampMax),
      this.clamp01(boosted.g, this.pulseClampMin, this.pulseClampMax),
      this.clamp01(boosted.b, this.pulseClampMin, this.pulseClampMax),
    );

    // Animate material color r/g/b (0..1)
    this.linesColorTween = gsap.to(this.linesMaterial.color, {
      r: target.r,
      g: target.g,
      b: target.b,
      duration: this.pulseDurationSec,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
    });
  }

  private clamp01(v: number, min: number, max: number): number {
    // clamp + keep inside [0,1]
    const vv = Math.min(1, Math.max(0, v));
    return Math.min(max, Math.max(min, vv));
  }
}

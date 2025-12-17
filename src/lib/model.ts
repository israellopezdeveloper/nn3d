import * as THREE from "three";
import type { ModelNode, LayerNode } from "./types.ts";
import { Layer } from "./layer.ts";
import { Neuron } from "./neuron.ts";

export class Model extends THREE.Group {
  public highlight: THREE.Mesh<THREE.BoxGeometry, THREE.MeshBasicMaterial>;
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

  declare userData: { node?: ModelNode } & THREE.Object3D["userData"];

  constructor(
    node: ModelNode,
    neuronSpacing: number,
    layerSpacing: number,
    neuronOutColor: THREE.Color | number = 0x0033ff,
    neuronInColor: THREE.Color | number = 0x66ccff,
    neuronFogColor: THREE.Color | number = 0x0088ff,
    lineColor: THREE.Color | number = 0x6ae3ff,
  ) {
    super();

    this.name = node.id;
    this.userData.node = node;

    this.neuronSpacing = neuronSpacing;
    this.layerSpacing = layerSpacing;

    this.neuronOutColor = neuronOutColor;
    this.neuronInColor = neuronInColor;
    this.neuronFogColor = neuronFogColor;

    this.lineColor = lineColor;

    // Highlight
    this.highlight = this.createHighlightMesh();
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

  getUserData(): ModelNode | undefined {
    return this.userData.node;
  }

  // ----------------- private helpers -----------------

  private createHighlightMesh(): THREE.Mesh<
    THREE.BoxGeometry,
    THREE.MeshBasicMaterial
  > {
    const geom = new THREE.BoxGeometry(1, 1, 1);
    const mat = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.1,
      depthWrite: false,
    });

    const mesh = new THREE.Mesh(geom, mat);
    mesh.name = `${this.name}:highlight`;
    mesh.visible = false;
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    return mesh;
  }

  private computeMaxNeurons(layerNodes: LayerNode[]): number {
    let max = 1;
    for (const ln of layerNodes) {
      max = Math.max(max, ln.neurons?.length ?? 0);
    }
    return Math.max(1, max);
  }

  /**
   * Apila capas una debajo de otra (Y decreciente).
   */
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

  /**
   * Conecta todas las neuronas de una capa con todas las de la capa siguiente.
   * Devuelve LineSegments (pares de puntos).
   */
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

    const lines = new THREE.LineSegments(geom, mat);
    lines.name = `${this.name}:connections`;

    return lines;
  }

  private fitHighlightToContent(): void {
    const prev = this.highlight.visible;
    this.highlight.visible = false;

    const box = new THREE.Box3().setFromObject(this);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    size.x = Math.max(size.x, 0.6);
    size.y = Math.max(size.y, 0.6);
    size.z = Math.max(size.z, 0.2);

    this.highlight.geometry.dispose();
    this.highlight.geometry = new THREE.BoxGeometry(
      size.x * 1.15,
      size.y * 1.15,
      size.z * 1.25,
    );
    this.highlight.position.copy(this.worldToLocal(center.clone()));

    this.highlight.visible = prev;
  }
}

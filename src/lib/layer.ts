import * as THREE from "three";
import type { LayerNode } from "./types.ts";
import { Neuron } from "./neuron.ts";

export class Layer extends THREE.Group {
  public highlight: THREE.Mesh<THREE.BoxGeometry, THREE.MeshBasicMaterial>;
  public nn_neurons: Neuron[] = [];

  private readonly maxNeurons: number;
  private readonly neuronSpacing: number;

  declare userData: LayerNode;

  constructor(
    node: LayerNode,
    maxNeurons: number,
    neuronSpacing: number,
    neuronOutColor: THREE.Color | number,
    neuronInColor: THREE.Color | number,
    neuronFogColor: THREE.Color | number,
  ) {
    super();

    this.name = `Layer:${node.id}`;
    this.userData = node;

    this.maxNeurons = Math.max(1, maxNeurons);
    this.neuronSpacing = neuronSpacing;

    // Highlight / hitbox (invisible by default)
    this.highlight = this.createHighlightMesh();
    this.add(this.highlight);

    // Create neurons
    for (const neuronNode of node.neurons) {
      const neuron = new Neuron(
        neuronNode,
        neuronOutColor,
        neuronInColor,
        neuronFogColor,
      );
      this.nn_neurons.push(neuron);
      this.add(neuron);
    }

    // Layout
    this.layoutNeuronsHorizontal();
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

  getUserData(): LayerNode | undefined {
    return this.userData;
  }

  // ----------------- private helpers -----------------

  private createHighlightMesh(): THREE.Mesh<
    THREE.BoxGeometry,
    THREE.MeshBasicMaterial
  > {
    const geom = new THREE.BoxGeometry(1, 1, 1);
    const mat = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
    });

    const mesh = new THREE.Mesh(geom, mat);
    mesh.name = `${this.name}:highlight`;
    mesh.visible = false;
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    return mesh;
  }

  /**
   * Neuronas en línea horizontal.
   * Importante: el "ancho" total se basa en maxNeurons para alinear capas.
   */
  private layoutNeuronsHorizontal(): void {
    const count = this.nn_neurons.length;
    if (count === 0) return;

    // Ancho reservado por capa (constante para todas)
    const reservedCount = this.maxNeurons;
    const totalWidth = (reservedCount - 1) * this.neuronSpacing;

    // centramos la capa en X=0 (desde -totalWidth/2 a +totalWidth/2)
    // y colocamos las neuronas reales centradas dentro del ancho reservado.
    const layerLeftX = -totalWidth / 2;

    // Para que las neuronas reales queden centradas dentro del "grid" reservado:
    const usedWidth = (count - 1) * this.neuronSpacing;
    const offsetX = (totalWidth - usedWidth) / 2;

    for (let i = 0; i < count; i++) {
      const x = layerLeftX + offsetX + i * this.neuronSpacing;
      this.nn_neurons[i].position.set(x, 0, 0);
    }
  }

  private fitHighlightToContent(): void {
    // Encaja el highlight alrededor del contenido del Layer
    const box = new THREE.Box3().setFromObject(this);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    size.x = Math.max(size.x, 0.25);
    size.y = Math.max(size.y, 0.2);
    size.z = Math.max(size.z, 0.1);

    this.highlight.geometry.dispose();
    this.highlight.geometry = new THREE.BoxGeometry(
      size.x * 1.15,
      size.y * 1.8,
      size.z * 1.4,
    );
    this.highlight.position.copy(this.worldToLocal(center.clone()));
  }
}

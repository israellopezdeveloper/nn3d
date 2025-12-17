import * as THREE from "three";
import type { LayerNode } from "$lib/types";
import { Neuron } from "$lib/objects/neuron";
import { Hoverable } from "$lib/objects/InteractiveObject";

export class Layer extends Hoverable {
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
    highlightColor: THREE.Color | number = 0x00aaff,
  ) {
    super(highlightColor);

    this.name = node.id;
    this.userData = node;

    this.maxNeurons = Math.max(1, maxNeurons);
    this.neuronSpacing = neuronSpacing;

    // Highlight / hitbox (invisible by default)
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

  getUserData(): LayerNode {
    return this.userData;
  }

  // ----------------- private helpers -----------------

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
}

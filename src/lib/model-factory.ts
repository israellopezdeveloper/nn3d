import * as THREE from "three";
import type { ModelNode, NN3DInterface } from "$lib/types";
import { Model } from "$lib/objects/model";
import type { Layer } from "$lib/objects/layer";
import type { Neuron } from "$lib/objects/neuron";

export type ModelResult = {
  group: THREE.Group;
  model: Model;
  layers: Layer[];
  neurons: Neuron[];
};

export class ModelFactory {
  constructor() {}

  public createNN(
    modelNode: ModelNode,
    index: number,
    total: number,
    rotate: boolean = false,
    config: NN3DInterface,
  ): ModelResult {
    const neuronSpacing = config.neuronSpacing ?? 2.0;
    const layerSpacing = config.layerSpacing ?? 2.2;

    const neuronOutColor = config.neuronOutColor ?? 0x0033ff;
    const neuronInColor = config.neuronInColor ?? 0x66ccff;
    const neuronFogColor = config.neuronFogColor ?? 0x0088ff;
    const lineColor = config.lineColor ?? 0x6ae3ff;

    // Wrapper group: SceneManager puede recolocarlo en horizontal
    const group = new THREE.Group();
    group.name = modelNode.id;

    // Crea el Model 3D
    const model = new Model(
      modelNode,
      neuronSpacing,
      layerSpacing,
      neuronOutColor,
      neuronInColor,
      neuronFogColor,
      lineColor,
    );

    // Posición inicial (SceneManager luego puede relayout)
    group.position.set((index - (total - 1) / 2) * 6, 0, 0);
    group.add(model);

    if (rotate) {
      group.rotateOnAxis(
        new THREE.Vector3(0, 0, 1).normalize(),
        -1 * (Math.PI / 2),
      );
    }

    const layers = (model as any).nnLayers as Layer[] | undefined;
    const neurons = (model as any).nnNeurons as Neuron[] | undefined;

    return {
      group,
      model,
      layers: layers ?? [],
      neurons: neurons ?? [],
    };
  }
}

import * as THREE from "three";
import type {
  ModelNode,
  LayerNode,
  NeuronInfo,
  LayerInfo,
  ModelInfo,
  NN3DInterface,
} from "./types.ts";
import { Neuron } from "./neuron.ts";
import { Panel } from "./panel.ts";

export type PanelResult = {
  group: THREE.Group;
  layers: Panel[];
  neurons: Neuron[];
};

export class PanelFactory {
  constructor() {}

  public createNN(
    model: ModelNode,
    index: number,
    total: number,
    rotate: boolean = false,
    config: NN3DInterface,
  ): PanelResult {
    function createNNLayers(
      modelId: string,
      layersNode: LayerNode[],
      rootGroup: THREE.Group,
    ): {
      layers: Panel[];
      neurons: Neuron[];
    } {
      const neurons: Neuron[] = [];
      const layers: Panel[] = [];

      const layerGroups: THREE.Group[] = [];
      const lines: THREE.Line[] = [];

      const layerSpacing = 2.2;
      const layerOffsetX = -((layersNode.length - 1) * layerSpacing) / 2;

      // Aquí guardaremos las posiciones (en coords del rootGroup)
      // de cada neurona por capa.
      const neuronPositionsByLayer: THREE.Vector3[][] = [];

      // 1) Crear capas + neuronas
      layersNode.forEach((layer, layerIndex) => {
        const layerGroup = new THREE.Group();
        layerGroup.name = `layer-${layerIndex + 1}`;

        const layerHeight: number = layer.neurons.length;
        const layerInfo: LayerInfo = {
          modelId: modelId,
          layerId: layer.id,
          neurons: layer.neurons,
        };
        const panel: Panel = new Panel({
          width: 1.02,
          height: layerHeight + 1,
          name: "panel",
          userData: layerInfo,
          color: 0x00bbff,
        });
        panel.hide();

        // Altura de ESTA capa según nº neuronas
        layerGroup.name = layer.id;
        layerGroup.add(panel);
        layers.push(panel);

        const xLayer = layerOffsetX + layerIndex * layerSpacing;
        layerGroup.position.set(xLayer, 0, 0);

        rootGroup.add(layerGroup);
        layerGroups.push(layerGroup);

        const count = layer.neurons.length;
        const stepY = count > 1 ? layerHeight / (count - 1) : 0;

        const layerNeuronPositions: THREE.Vector3[] = [];

        layer.neurons.forEach((neuron, neuronIndex) => {
          const y = count === 1 ? 0 : -layerHeight / 2 + neuronIndex * stepY;

          const mesh: Neuron = new Neuron(
            config.neuronOutColor,
            config.neuronInColor,
            config.neuronFogColor,
          );
          mesh.name = neuron.id;
          const neuronInfo: NeuronInfo = {
            modelId: modelId,
            layerId: layer.id,
            neuronId: neuron.id,
          };
          mesh.userData = neuronInfo;
          // Posición local dentro de la capa
          mesh.position.set(0, y, 0);
          layerGroup.add(mesh);

          neurons.push(mesh);

          // Posición de la neurona en coords del rootGroup
          // (x de la capa + y local)
          layerNeuronPositions.push(new THREE.Vector3(xLayer, y, 0));
        });

        neuronPositionsByLayer.push(layerNeuronPositions);
      });

      // 2) Crear líneas usando las posiciones reales de neuronas
      for (let layerIndex = 1; layerIndex < layersNode.length; layerIndex++) {
        const prevLayerPositions = neuronPositionsByLayer[layerIndex - 1];
        const currLayerPositions = neuronPositionsByLayer[layerIndex];

        for (let pi = 0; pi < prevLayerPositions.length; pi++) {
          for (let ci = 0; ci < currLayerPositions.length; ci++) {
            const p = prevLayerPositions[pi];
            const c = currLayerPositions[ci];

            const lineMat = new THREE.LineBasicMaterial({
              color: config.lineColor,
              transparent: true,
              opacity: 0.25,
            });

            const points = [p, c];
            const lineGeom = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(lineGeom, lineMat);

            rootGroup.add(line);
            lines.push(line);
          }
        }
      }

      return { layers: layers, neurons: neurons };
    }

    if (!model.layers) {
      model.layers = [];
    }
    let width: number = model.layers.length || 0;
    let height: number = 0;
    for (let i = 0; i < width; ++i) {
      height = Math.max(height, model.layers[i].neurons.length || 0);
    }
    width += Math.max(0, width - 1) * 1.3;
    height += 1.3;
    const modelInfo: ModelInfo = {
      modelId: model.id,
      layers: model.layers,
    };
    const panel: Panel = new Panel({
      width: width,
      height: height,
      name: "panel",
      userData: modelInfo,
      color: 0x00bbff,
    });

    const group = new THREE.Group();
    group.position.set(
      panel.position.x,
      panel.position.y,
      panel.position.z - 1.2,
    );
    group.name = model.id;
    group.add(panel);
    group.position.set((index - (total - 1) / total) * 6, 0, 0);

    const { layers, neurons } = createNNLayers(model.id, model.layers, group);
    if (rotate) {
      group.rotateOnAxis(
        new THREE.Vector3(0, 0, 1).normalize(),
        -1 * (Math.PI / 2),
      );
    }
    return {
      group: group,
      layers: layers,
      neurons: neurons,
    };
  }
}

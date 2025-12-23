import { Color } from "three";
import type { CameraRig } from "$lib/camera-rig";
import type { Neuron } from "$lib/objects/neuron";
import type { Model } from "$lib/objects/model";
import type { Layer } from "$lib/objects/layer";

export type InteractionConfig = {
  rig: CameraRig;
  element: HTMLElement;
  models: Model[];
  layers: Layer[];
  neurons: Neuron[];
  onNothingSelect?: () => void;
  onModelSelect?: (info: ModelNode) => void;
  onLayerSelect?: (modelId: string, info: LayerNode) => void;
  onNeuronSelect?: (modelId: string, layerId: string, info: NeuronNode) => void;
};

export type CameraMode =
  | "overview"
  | "modelFocus"
  | "layerFocus"
  | "neuronFocus";

export type NeuronNode = {
  id: string;
  label: string;
};

export type LayerNode = {
  id: string;
  label: string;
  neurons: NeuronNode[];
};

export type ModelNode = {
  id: string;
  label: string;
  layers?: LayerNode[];
};

export type NN3DInterface = {
  models: ModelNode[];
  background?: string;

  // Colores de neuronas
  neuronOutColor?: Color | number;
  neuronInColor?: Color | number;
  neuronFogColor?: Color | number;

  // Color de líneas
  lineColor?: Color | number;

  // Color highlight
  highlightColor?: Color | number;

  // Layout / spacing
  neuronSpacing?: number;
  layerSpacing?: number;

  // callbacks opcionales desde el padre
  onNothingSelect?: () => void;
  onModelSelect?: (info: ModelNode) => void;
  onLayerSelect?: (modelId: string, info: LayerNode) => void;
  onNeuronSelect?: (modelId: string, layerId: string, info: NeuronNode) => void;
};

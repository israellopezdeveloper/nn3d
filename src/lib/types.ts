import { Color } from "three";
import type { CameraRig } from "./camera-rig.ts";
import type { Neuron } from "./neuron.ts";
import type { Model } from "./model.ts";
import type { Layer } from "./layer.ts";

export type InteractionConfig = {
  rig: CameraRig;
  element: HTMLElement;
  models: Model[];
  layers: Layer[];
  neurons: Neuron[];
  onNothingSelect?: () => void;
  onModelSelect?: (info: ModelInfo) => void;
  onLayerSelect?: (info: LayerInfo) => void;
  onNeuronSelect?: (info: NeuronInfo) => void;
};

export type CameraMode =
  | "overview"
  | "modelFocus"
  | "layerFocus"
  | "neuronFocus";

export type NeuronInfo = { modelId: string; layerId: string; neuronId: string };

export type ModelInfo = {
  modelId: string;
  layers: LayerNode[];
};

export type LayerInfo = {
  modelId: string;
  layerId: string;
  neurons: NeuronNode[];
};

export type NeuronNode = {
  id: string;
  label: string;
  type: string;
};

export type LayerNode = {
  id: string;
  label: string;
  type: string;
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

  // Layout / spacing
  neuronSpacing?: number;
  layerSpacing?: number;

  // callbacks opcionales desde el padre
  onNothingSelect?: () => void;
  onModelSelect?: (info: ModelInfo) => void;
  onLayerSelect?: (info: LayerInfo) => void;
  onNeuronSelect?: (info: NeuronInfo) => void;
};

import { Color, OrthographicCamera } from "three";
import type { CameraRig } from "./camera-rig.ts";
import type { Panel } from "./panel.ts";
import type { Neuron } from "./neuron.ts";

export type InteractionConfig = {
  camera: OrthographicCamera;
  rig: CameraRig;
  element: HTMLElement;
  models: Panel[];
  layers: Panel[];
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
  type: "project" | "course" | "education" | "language";
};

export type LayerNode = {
  id: string;
  label: string;
  type: "projects" | "complementary" | "university" | "languages";
  neurons: NeuronNode[];
};

export type ModelNode = {
  id: "jobs" | "education";
  label: string; // 'jobs', 'education'
  layers?: LayerNode[]; // para education
};

export type NN3DInterface = {
  models: ModelNode[];
  background?: string;

  neuronOutColor?: Color | number;
  neuronInColor?: Color | number;
  neuronFogColor?: Color | number;

  lineColor?: Color | number;

  // callbacks opcionales desde el padre
  onNothingSelect?: () => void;
  onModelSelect?: (info: ModelInfo) => void;
  onLayerSelect?: (info: LayerInfo) => void;
  onNeuronSelect?: (info: NeuronInfo) => void;
};

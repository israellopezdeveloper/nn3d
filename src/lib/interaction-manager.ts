import * as THREE from "three";
import type { CameraRig } from "./camera-rig.ts";
import { Neuron } from "./neuron.ts";
import type {
  CameraMode,
  InteractionConfig,
  LayerNode,
  ModelNode,
  NeuronNode,
} from "./types.ts";
import type { Model } from "./model.ts";
import type { Layer } from "./layer.ts";
import type { Hoverable } from "./InteractiveObject.ts";

export class InteractionManager {
  private rig: CameraRig;
  private element: HTMLElement;

  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();

  private models: Model[];
  private layers: Layer[];
  private neurons: Neuron[];

  private onNothingSelect: () => void;
  private onModelSelect: (info: ModelNode) => void;
  private onLayerSelect: (info: LayerNode) => void;
  private onNeuronSelect: (info: NeuronNode) => void;

  private mode: CameraMode = "overview";
  private focused: Model | Layer | Neuron | null = null;

  private hovered: Model | Layer | Neuron | null = null;

  private readonly handlePointerMoveBound: (e: PointerEvent) => void;
  private readonly handlePointerDownBound: (e: PointerEvent) => void;

  constructor(config: InteractionConfig) {
    this.rig = config.rig;
    this.element = config.element;

    this.models = config.models;
    this.layers = config.layers;
    this.neurons = config.neurons;

    this.onNothingSelect = config.onNothingSelect ?? (() => {});
    this.onModelSelect = config.onModelSelect ?? ((_) => {});
    this.onLayerSelect = config.onLayerSelect ?? ((_) => {});
    this.onNeuronSelect = config.onNeuronSelect ?? ((_) => {});

    this.handlePointerMoveBound = (e) => this.onPointerMove(e);
    this.handlePointerDownBound = (e) => this.onPointerDown(e);

    this.element.addEventListener("pointermove", this.handlePointerMoveBound);
    this.element.addEventListener("pointerdown", this.handlePointerDownBound);
  }

  // --- API pública útil si quieres forzar estados desde fuera --- //
  public getCurrentMode(): CameraMode {
    return this.mode;
  }

  public getFocused(): Model | Layer | Neuron | null {
    return this.focused;
  }

  private getObjectsForCurrentMode(): (Model | Layer | Neuron)[] {
    if (this.mode === "overview") {
      return this.models;
    }

    if (this.mode === "modelFocus") {
      return this.layers;
    }

    if (this.mode === "layerFocus") {
      return this.neurons;
    }

    if (this.mode === "neuronFocus") {
      return this.layers;
    }

    return this.models;
  }

  private intersectWith<T extends THREE.Object3D & Hoverable>(
    objects: T[],
  ): T | null {
    this.raycaster.setFromCamera(this.mouse, this.rig.camera);
    const intersects = this.raycaster.intersectObjects(objects, true);

    if (intersects.length === 0) return null;

    let obj: THREE.Object3D | null = intersects[0].object;

    const set = new Set(objects);

    while (obj) {
      if (set.has(obj as T)) {
        return obj as T;
      }
      obj = obj.parent;
    }

    return null;
  }

  // --- Lógica de hover --- //
  private handleHover() {
    const objects = this.getObjectsForCurrentMode();
    const intersected: Neuron | Model | Layer | null =
      this.intersectWith(objects);

    if (this.hovered && this.hovered !== intersected) {
      this.hovered.onHoverOut();
      this.hovered = null;
    }

    if (intersected) {
      this.hovered = intersected;
      this.hovered.onHoverIn();
      this.element.style.cursor = "pointer";
    } else {
      this.element.style.cursor = "default";
    }
  }

  // --- Lógica de click --- //
  public setMode(
    mode: CameraMode,
    target: Model | Layer | Neuron | null = null,
  ) {
    this.mode = mode;

    // reset hover
    if (this.hovered) {
      this.hovered.onHoverOut();
      this.hovered = null;
    }

    // Ajustes de visibilidad según modo
    if (mode === "overview") {
      this.focused = null;
      return;
    }
    this.focused = target;
  }

  private selectNothing() {
    this.setMode("overview");
    this.rig.focusOverview();
    this.onNothingSelect();
  }

  private selectModel(model: Model) {
    this.setMode("modelFocus", model);
    this.rig.focusOnObject(model, "modelFocus");
    this.onModelSelect(model.userData as ModelNode);
  }

  private selectLayer(layer: Layer) {
    this.setMode("layerFocus", layer);
    this.rig.focusOnObject(layer, "layerFocus");
    this.onLayerSelect(layer.userData as LayerNode);
  }

  private selectNeuron(neuron: Neuron) {
    this.setMode("neuronFocus", neuron);
    this.rig.focusOnObject(neuron, "neuronFocus");
    this.onNeuronSelect(neuron.userData as NeuronNode);
  }

  // --- Eventos DOM --- //
  private onPointerMove(e: PointerEvent) {
    const rect = this.element.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

    this.handleHover();
  }

  private onPointerDown(e: PointerEvent) {
    const rect = this.element.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

    const objects: (Model | Layer | Neuron)[] = this.getObjectsForCurrentMode();
    const clicked: Model | Layer | Neuron | null = this.intersectWith(objects);

    if (!clicked) {
      this.selectNothing();
      return;
    }

    // En overview solo model
    if (this.mode === "overview") {
      this.selectModel(clicked as Model);
      return;
    }

    // En modelFocus clicamos layer
    if (this.mode === "modelFocus") {
      this.selectLayer(clicked as Layer);
      return;
    }

    // En layerFocus clicamos neuronas
    if (this.mode === "layerFocus") {
      this.selectNeuron(clicked as Neuron);
      return;
    }

    // En neuronFocus: click fuera vuelve a layerFocus
    if (this.mode === "neuronFocus") {
      this.setMode("layerFocus");
      this.rig.focusOnObject(clicked as THREE.Object3D, "layerFocus");
      return;
    }
  }

  // --- Limpieza --- //
  public dispose() {
    this.element.removeEventListener(
      "pointermove",
      this.handlePointerMoveBound,
    );
    this.element.removeEventListener(
      "pointerdown",
      this.handlePointerDownBound,
    );
    this.element.style.cursor = "default";
  }
}

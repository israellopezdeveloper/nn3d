import * as THREE from "three";
import type { CameraRig } from "./camera-rig.ts";
import { Neuron } from "./neuron.ts";
import type { Panel } from "./panel.ts";
import type {
  CameraMode,
  InteractionConfig,
  LayerInfo,
  ModelInfo,
  NeuronInfo,
} from "./types.ts";
import type { Model } from "./model.ts";
import type { Layer } from "./layer.ts";

export class InteractionManager {
  private rig: CameraRig;
  private element: HTMLElement;

  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();

  private models: Model[];
  private layers: Layer[];
  private neurons: Neuron[];

  private onNothingSelect: () => void;
  private onModelSelect: (info: ModelInfo) => void;
  private onLayerSelect: (info: LayerInfo) => void;
  private onNeuronSelect: (info: NeuronInfo) => void;

  private mode: CameraMode = "overview";
  private focusedModel: Model | null = null;
  private focusedLayer: Layer | null = null;
  private focusedNeuron: Neuron | null = null;

  private hovered: Model | Layer | Neuron | null = null;

  private readonly handlePointerMoveBound: (e: PointerEvent) => void;
  private readonly handlePointerDownBound: (e: PointerEvent) => void;

  constructor(config: InteractionConfig) {
    // Nota: config.camera puede existir por el type, pero la fuente real es rig.camera
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

  public getFocusedModelId(): Record<string, any> | null {
    if (this.focusedModel) {
      return this.focusedModel.userData;
    }
    return null;
  }

  public getFocusedModel(): Model | null {
    return this.focusedModel;
  }

  public getFocusedLayer(): Layer | null {
    return this.focusedLayer;
  }

  public getFocusedNeuron(): Neuron | null {
    return this.focusedNeuron;
  }

  private getObjectsForCurrentMode(): (Model | Layer | Neuron)[] {
    if (this.mode === "overview") {
      return this.models;
    }

    if (this.mode === "modelFocus") {
      // Cuando estamos en modelFocus, lo clicable son capas (panels)
      return this.layers;
    }

    if (this.mode === "layerFocus") {
      // fallback seguro
      return this.neurons;
    }

    if (this.mode === "neuronFocus") {
      // fallback seguro
      return this.layers;
    }

    return this.models;
  }

  private intersectWith(
    objects: (Model | Layer | Neuron)[],
  ): THREE.Object3D | null {
    this.raycaster.setFromCamera(this.mouse, this.rig.camera);
    const intersects = this.raycaster.intersectObjects(objects, true);

    if (intersects.length === 0) return null;

    let obj = intersects[0].object;

    const objs = objects.map((o) => o as THREE.Object3D);
    // Subir por la jerarquía hasta encontrar un objeto del array original
    while (obj) {
      if (objs.includes(obj)) {
        return obj;
      }
      obj = obj.parent!;
    }

    return null;
  }

  // --- Lógica de hover --- //
  private handleHover() {
    const objects: (Model | Layer | Neuron)[] = this.getObjectsForCurrentMode();
    const intersected: THREE.Object3D | null = this.intersectWith(objects);

    const newPanel: Panel = intersected as Panel;

    if (this.hovered && this.hovered !== newPanel) {
      this.hovered.hoverOut();
      this.hovered = null;
    }

    if (newPanel) {
      this.hovered = newPanel;
      this.hovered.hoverIn();
      this.element.style.cursor = "pointer";
    } else {
      this.element.style.cursor = "default";
    }
  }

  // --- Lógica de click --- //
  public setMode(mode: CameraMode, target: Panel | Neuron | null = null) {
    this.mode = mode;

    // reset hover
    if (this.hovered) {
      this.hovered.hoverOut();
      this.hovered = null;
    }

    // Ajustes de visibilidad según modo
    if (mode === "overview") {
      this.models.forEach((p) => showPanel(p, "overview"));
      // this._layers.forEach((p) => (p.visible = false));
      // this._neurons.forEach((n) => (n.visible = false));
      this.focusedModel = null;
      this.focusedNeuron = null;
      return;
    }

    if (mode === "modelFocus") {
      // target debe ser un Model (Panel)
      const model = target as Panel;
      this.focusedModel = model;

      this.models.forEach((p) =>
        showPanel(p, p === model ? "overview" : "modelFocus"),
      );

      // this._layers.forEach((l) => {
      //   l.visible = l.parent === model.parent;
      // });

      // this._neurons.forEach((n) => (n.visible = false));
      this.focusedNeuron = null;
      return;
    }

    if (mode === "layerFocus") {
      // target debe ser una Layer (Panel)
      // const layer = target as Panel;
      // this._layers.forEach((l) => (l.visible = l === layer));
      // this._neurons.forEach((n) => (n.visible = true));
      this.focusedNeuron = null;
      return;
    }

    if (mode === "neuronFocus") {
      // target debe ser un Neuron
      const neuron = target as Neuron;
      this.focusedNeuron = neuron;

      // this._neurons.forEach((n) => (n.visible = n === neuron));
      // this._layers.forEach((l) => (l.visible = false));
      return;
    }
  }

  private selectNothing() {
    this.setMode("overview");
    this.rig.focusOverview();
    this.onNothingSelect();
  }

  private selectModel(panel: Panel) {
    this.setMode("modelFocus", panel);
    this.rig.focusOnObject(panel, "modelFocus");
    this.onModelSelect(panel.userData as ModelInfo);
  }

  private selectLayer(panel: Panel) {
    this.setMode("layerFocus", panel);
    this.rig.focusOnObject(panel, "layerFocus");
    this.onLayerSelect(this.focusedModel?.userData as LayerInfo);
  }

  private selectNeuron(neuron: Neuron) {
    this.setMode("neuronFocus", neuron);
    this.rig.focusOnObject(neuron, "neuronFocus");
    this.onNeuronSelect(neuron.userData as NeuronInfo);
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

    const objects: (Panel | Neuron)[] = this.getObjectsForCurrentMode();
    const clicked = this.intersectWith(objects);

    if (!clicked) {
      this.selectNothing();
      return;
    }

    // En overview solo model-panels
    if (this.mode === "overview") {
      this.selectModel(clicked as Panel);
      return;
    }

    // En modelFocus clicamos layer-panels
    if (this.mode === "modelFocus") {
      this.selectLayer(clicked as Panel);
      return;
    }

    // En layerFocus clicamos neuronas
    if (this.mode === "layerFocus") {
      this.selectNeuron(clicked as Neuron);
      return;
    }

    // En neuronFocus: click fuera vuelve a layerFocus (o lo que quieras)
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

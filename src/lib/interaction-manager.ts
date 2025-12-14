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

export class InteractionManager {
  private _camera: THREE.OrthographicCamera;
  private _rig: CameraRig;
  private _element: HTMLElement;

  private _raycaster = new THREE.Raycaster();
  private _mouse = new THREE.Vector2();

  private _models: Panel[];
  private _layers: Panel[];
  private _neurons: Neuron[];

  private _onNothingSelect: () => void;
  private _onModelSelect: (info: ModelInfo) => void;
  private _onLayerSelect: (info: LayerInfo) => void;
  private _onNeuronSelect: (info: NeuronInfo) => void;

  private _mode: CameraMode = "overview";
  private _focusedModel: Panel | null = null;
  private _focusedNeuron: Neuron | null = null;

  private _hoveredPanel: Panel | null = null;

  private readonly _handlePointerMoveBound: (e: PointerEvent) => void;
  private readonly _handlePointerDownBound: (e: PointerEvent) => void;

  constructor(config: InteractionConfig) {
    this._camera = config.camera;
    this._rig = config.rig;
    this._element = config.element;

    this._models = config.models;
    this._layers = config.layers;
    this._neurons = config.neurons;

    this._onNothingSelect = config.onNothingSelect ?? (() => {});
    this._onModelSelect = config.onModelSelect ?? ((_) => {});
    this._onLayerSelect = config.onLayerSelect ?? ((_) => {});
    this._onNeuronSelect = config.onNeuronSelect ?? ((_) => {});

    this._handlePointerMoveBound = (e) => this.onPointerMove(e);
    this._handlePointerDownBound = (e) => this.onPointerDown(e);

    this._element.addEventListener("pointermove", this._handlePointerMoveBound);
    this._element.addEventListener("pointerdown", this._handlePointerDownBound);
  }

  // --- API pública útil si quieres forzar estados desde fuera --- //
  public getCurrentMode(): CameraMode {
    return this._mode;
  }

  public getFocusedModelId(): Record<string, any> | null {
    if (this._focusedModel) {
      return this._focusedModel.userData;
    }
    return null;
  }

  public getFocusedModel(): Panel | null {
    return this._focusedModel;
  }

  public getFocusedNeuron(): Neuron | null {
    return this._focusedNeuron;
  }

  // --- Eventos internos --- //
  private onPointerMove(e: PointerEvent) {
    this.updateMouse(e);
    this.handleHover();
  }

  private onPointerDown(e: PointerEvent) {
    this.updateMouse(e);
    this.handleClick();
  }

  // --- Utilidades de picking --- //
  private updateMouse(e: PointerEvent) {
    const rect = this._element.getBoundingClientRect();
    this._mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this._mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }

  private getObjectsForCurrentMode(): (Panel | Neuron)[] {
    if (this._mode === "overview") {
      return this._models;
    }

    if (this._mode === "modelFocus") {
      return this._layers;
    }

    if (this._mode === "layerFocus") {
      // fallback seguro
      return this._neurons;
    }

    if (this._mode === "neuronFocus") {
      // fallback seguro
      return this._layers;
    }

    return this._models;
  }

  private intersectWith(objects: (Panel | Neuron)[]): THREE.Object3D | null {
    this._raycaster.setFromCamera(this._mouse, this._camera);
    const intersects = this._raycaster.intersectObjects(objects, true);

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
    const objects: (Panel | Neuron)[] = this.getObjectsForCurrentMode();
    const intersected: THREE.Object3D | null = this.intersectWith(objects);

    // Solo nos interesa si lo que hay debajo del ratón es un Panel
    // const newPanel =
    //   intersected instanceof Panel ? (intersected as Panel) : null;
    const newPanel: Panel = intersected as Panel;

    // Si no ha cambiado el panel "hovered", no hacemos nada
    if (newPanel === this._hoveredPanel) {
      return;
    }

    // Quitamos el efecto del panel anterior
    if (this._hoveredPanel) {
      this._hoveredPanel.hoverOut();
    }

    // Actualizamos referencia
    this._hoveredPanel = newPanel;

    // Aplicamos efecto al nuevo panel (si hay)
    if (this._hoveredPanel) {
      this._hoveredPanel.hoverIn();
      this._element.style.cursor = "pointer";
    } else {
      this._element.style.cursor = "default";
    }
  }

  // --- Lógica de click --- //
  public setMode(mode: CameraMode, target: Panel | Neuron | null = null) {
    function showPanel(panel: Panel, mode: CameraMode) {
      panel.visible = mode === "overview";
      panel.parent?.children
        .filter((chld) => chld.type === "Group")
        .forEach((chld) => {
          chld.children
            .filter((schld) => schld.name === "panel")
            .forEach((schld) => {
              (schld as Panel).show();
            });
        });
    }

    this._mode = mode;
    if (mode === "overview") {
      if (this._focusedModel) showPanel(this._focusedModel, mode);
      this._focusedModel = null;
      this._focusedNeuron = null;
      this._onNothingSelect();
      this._models.forEach((m) => showPanel(m, mode));
    } else if (mode === "modelFocus" && target) {
      this._focusedModel = target as Panel;
      if (this._focusedModel) {
        showPanel(this._focusedModel, mode);
        this._onModelSelect(target.userData as ModelInfo);
      }
      this._focusedNeuron = null;
    } else if (mode === "layerFocus" && target) {
      this._focusedModel = target as Panel;
      if (this._focusedModel) {
        showPanel(this._focusedModel, mode);
        this._onLayerSelect(target.userData as LayerInfo);
      }
      this._focusedNeuron = null;
    } else {
      this._focusedNeuron = target?.parent?.children.filter(
        (chld) => chld.name === "panel",
      )[0] as Neuron;
      if (this._focusedModel) {
        showPanel(this._focusedModel, mode);
        this._onNeuronSelect(target?.userData as NeuronInfo);
      }
    }
  }

  private handleClick() {
    const objects = this.getObjectsForCurrentMode();
    let clicked: THREE.Object3D | null = this.intersectWith(objects);

    // Click fuera en modo foco → overview
    if (this._mode === "modelFocus" && this._focusedModel && !clicked) {
      this.setMode("overview");
      this._rig.focusOverview();
      return;
    }
    // Click modelo en modo overview → modelFocus
    if (
      (clicked && this._mode === "overview") ||
      (!clicked && this._mode === "layerFocus")
    ) {
      if (!clicked) {
        clicked = this._focusedModel?.parent?.parent?.children.filter(
          (cld) => cld.name === "panel",
        )[0] as THREE.Mesh;
      }
      const modelId: string | null = clicked.userData.modelId || null;
      if (modelId) {
        this._layers.forEach((l) => l.hide());
        this.setMode("modelFocus", clicked as Panel);
        this._rig.focusOnObject(clicked, "modelFocus");
      }
      return;
    }
    // Click neurona en modo modelFocus → layerFocus
    // Click layer en modo neuronFocus -> layerFocus
    if (
      (clicked && this._mode === "modelFocus") ||
      ((clicked?.name === "panel" || !clicked) && this._mode === "neuronFocus")
    ) {
      if (!clicked) {
        clicked = this._focusedModel;
      }
      if (!clicked) return;
      const info: NeuronInfo = clicked.userData as NeuronInfo;
      if (info) {
        this._layers.forEach((l) => l.hide());
        this.setMode("layerFocus", clicked as Panel);
        this._rig.focusOnObject(clicked, "layerFocus");
      }
      return;
    }
    // Click modelo en modo layerFocus → neuronFocus
    if (clicked && this._mode === "layerFocus") {
      const modelId: string | null = clicked.userData.modelId || null;
      if (modelId) {
        this._layers.forEach((l) => l.hide());
        this.setMode("neuronFocus", clicked as Neuron);
        this._rig.focusOnObject(clicked, "neuronFocus");
      }
      return;
    }
  }

  // --- Limpieza --- //
  public dispose() {
    this._element.removeEventListener(
      "pointermove",
      this._handlePointerMoveBound,
    );
    this._element.removeEventListener(
      "pointerdown",
      this._handlePointerDownBound,
    );
    this._element.style.cursor = "default";
  }
}

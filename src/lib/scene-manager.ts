import * as THREE from "three";
import { CameraRig } from "$lib/camera-rig";
import { ModelFactory, type ModelResult } from "$lib/model-factory";
import { InteractionManager } from "$lib/interaction-manager";
import type { ModelNode, NN3DInterface } from "$lib/types";
import type { Neuron } from "$lib/objects/neuron";
import type { Model } from "$lib/objects/model";
import type { Layer } from "$lib/objects/layer";

export class SceneManager {
  private _container: HTMLElement;

  private _interaction: InteractionManager;
  private readonly _handleResizeBound: () => void;

  private _scene: THREE.Scene;
  private _renderer: THREE.WebGLRenderer;
  private _rig: CameraRig;

  private _rootGroup: THREE.Group;
  private _panelResults: ModelResult[] = [];
  private _panelWidths: number[] = [];

  private _models: Model[] = [];
  private _layers: Layer[] = [];
  private _neurons: Neuron[] = [];

  private _animationId: number = 0;

  private _backgroundMesh: THREE.Mesh | null = null;
  private readonly _config: NN3DInterface;

  constructor(container: HTMLElement, config: NN3DInterface) {
    this._container = container;
    this._config = config;

    // 1. Setup básico
    this._scene = new THREE.Scene();
    const rect = container.getBoundingClientRect();

    this._renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this._renderer.setSize(container.clientWidth, container.clientHeight);
    this._renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(this._renderer.domElement);

    this.setupLights();

    // Grupo raíz que contiene todos los paneles
    this._rootGroup = new THREE.Group();
    this._rootGroup.visible = false;
    this._rootGroup.castShadow = false;
    this._rootGroup.receiveShadow = false;
    this._scene.add(this._rootGroup);

    this.buildModels(this._config.models);
    if (this._config.background) {
      this._createBackground(this._config.background);
    }
    if (this._backgroundMesh) this._scene.add(this._backgroundMesh);

    // Una vez construidos todos, los distribuimos en horizontal
    this.layoutPanelsHorizontally(10); // gap fijo entre paneles (ajusta a gusto)

    // Cámara/rígido: todo lo relacionado con cámara vive aquí
    this._rig = new CameraRig({
      rootGroup: this._rootGroup,
      viewportWidth: rect.width,
      viewportHeight: rect.height,
      fov: 70,
      near: 0.1,
      far: 200,
    });
    this._rig.focusOverview(this._rootGroup);

    // InteractionManager se encarga de hover/click + raycaster
    this._interaction = new InteractionManager({
      rig: this._rig,
      element: this._renderer.domElement,
      models: this._models,
      layers: this._layers,
      neurons: this._neurons,
      onNothingSelect: this._config.onNothingSelect,
      onModelSelect: this._config.onModelSelect,
      onLayerSelect: this._config.onLayerSelect,
      onNeuronSelect: this._config.onNeuronSelect,
    });

    // Resize
    this._handleResizeBound = () => this.onResize();
    this.onResize();
    window.addEventListener("resize", this._handleResizeBound);

    // Mostrar root cuando ya está todo listo (si quieres mantenerlo oculto por diseño, quita esto)
    this._rootGroup.visible = true;

    // 4. Empezar loop
    this.animate();
  }

  /**
   * Crea un plano de fondo en el mundo, detrás de todos los paneles,
   * con la textura indicada.
   */
  private _createBackground(background: string) {
    const box = new THREE.Box3().setFromObject(this._rootGroup);

    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    // Valores por defecto por si aún no hay nada en el rootGroup
    const width = (size.x || 10) * 10;
    const height = (size.y || 10) * 10;

    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load(background);

    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);

    const geo = new THREE.PlaneGeometry(width, height);
    const mat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(center.x, center.y, -20);

    this._backgroundMesh = mesh;
  }

  private setupLights() {
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight.position.set(3, 5, 8);
    this._scene.add(dirLight);

    const ambLight = new THREE.AmbientLight(0xffffff, 0.5);
    this._scene.add(ambLight);
  }

  private buildModels(models: ModelNode[]) {
    const panelFactory = new ModelFactory();

    models.forEach((model, i) => {
      const panelResult: ModelResult = panelFactory.createNN(
        model,
        i,
        models.length,
        false,
        this._config,
      );
      this._panelResults.push(panelResult);

      this._models.push(panelResult.model);
      this._layers.push(...panelResult.layers);
      this._neurons.push(...panelResult.neurons);

      this._rootGroup.add(panelResult.group);

      const box = new THREE.Box3().setFromObject(panelResult.group);
      const size = new THREE.Vector3();
      box.getSize(size);
      this._panelWidths.push(size.x || 10);
    });
  }

  private layoutPanelsHorizontally(gap: number) {
    const totalWidth =
      this._panelWidths.reduce((acc, w) => acc + w, 0) +
      gap * (this._panelResults.length - 1);

    let cursorX = -totalWidth / 2;

    this._panelResults.forEach((panelResult, i) => {
      const w = this._panelWidths[i];
      const centerX = cursorX + w / 2;

      panelResult.group.position.x = centerX;

      cursorX += w + gap;
    });
  }

  private onResize() {
    const rect = this._container.getBoundingClientRect();

    this._rig.resize(rect.width, rect.height);
    this._renderer.setSize(rect.width, rect.height);

    const focused = this._interaction.getFocused();

    if (this._interaction.getCurrentMode() === "overview") {
      this._rig.focusOverview();
    } else if (focused) {
      this._rig.focusOnObject(focused, this._interaction.getCurrentMode());
    }
  }

  private animate = () => {
    this._animationId = requestAnimationFrame(this.animate);

    this._rig.update(performance.now());
    this._renderer.render(this._scene, this._rig.camera);
  };

  public dispose() {
    cancelAnimationFrame(this._animationId);

    window.removeEventListener("resize", this._handleResizeBound);
    this._interaction.dispose();

    for (const n of this._neurons) {
      (n as unknown as { dispose?: () => void }).dispose?.();
    }

    this._renderer.dispose();

    this._scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((m) => m.dispose());
      } else if (mesh.material) {
        mesh.material.dispose();
      }
    });

    if (this._backgroundMesh) {
      this._backgroundMesh.geometry.dispose();
      (this._backgroundMesh.material as THREE.Material).dispose();
      this._backgroundMesh = null;
    }
  }

  public goto(
    modelID: string | null = null,
    layerID: string | null = null,
    neuronID: string | null = null,
  ) {
    if (!modelID) {
      this._interaction.setMode("overview");
      this._rig.focusOverview();
      if (this._config.onNothingSelect) {
        this._config.onNothingSelect();
      }
      return;
    }

    if (!layerID) {
      const model: Model | undefined = this._models.find(
        (m) => m.name === modelID,
      );
      if (!model) return;

      this._interaction.setMode("modelFocus", model);
      this._rig.focusOnObject(model, "modelFocus");
      if (this._config.onModelSelect) {
        this._config.onModelSelect(model.getUserData());
      }
      return;
    }

    if (!neuronID) {
      const layer: Layer | undefined = this._layers.find(
        (l) => l.name === layerID,
      );
      if (!layer) return;

      this._interaction.setMode("layerFocus", layer);
      this._rig.focusOnObject(layer, "layerFocus");
      if (this._config.onLayerSelect) {
        this._config.onLayerSelect(layer.getUserData());
      }
      return;
    }

    // Neuron focus
    const neuron: Neuron | undefined = this._neurons.find(
      (n) => n.name === neuronID,
    );

    if (!neuron) return;

    this._interaction.setMode("neuronFocus", neuron);
    this._rig.focusOnObject(neuron, "neuronFocus");
    if (this._config.onNeuronSelect) {
      this._config.onNeuronSelect(neuron.getUserData());
    }
  }
}

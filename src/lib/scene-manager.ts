import * as THREE from "three";
import { CameraRig } from "./camera-rig.ts";
import { PanelFactory, type PanelResult } from "./panel-factory.ts";
import { InteractionManager } from "./interaction-manager.ts";
import type { ModelNode, NN3DInterface } from "./types.ts";
import type { Neuron } from "./neuron.ts";
import type { Panel } from "./panel.ts";

export class SceneManager {
  private _container: HTMLElement;

  private _interaction: InteractionManager;
  private readonly _handleResizeBound: () => void;

  private _scene: THREE.Scene;
  private _camera: THREE.OrthographicCamera;
  private _renderer: THREE.WebGLRenderer;
  private _rig: CameraRig;

  private _rootGroup: THREE.Group;
  private _panelResults: PanelResult[] = [];
  private _panelWidths: number[] = [];

  private _models: Panel[] = [];
  private _layers: Panel[] = [];
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
    const aspect = rect.width / rect.height;
    const frustumSize = 10;
    this._camera = new THREE.OrthographicCamera(
      (-frustumSize * aspect) / 2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      -frustumSize / 2,
      0.1,
      1000,
    );
    this._camera.position.set(0, 0, 10);

    this._renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this._renderer.setSize(container.clientWidth, container.clientHeight);
    this._renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(this._renderer.domElement);

    this.setupLights();

    // Grupo raíz que contiene todos los paneles
    this._rootGroup = new THREE.Group();
    this._scene.add(this._rootGroup);

    this.buildModels(this._config.models);
    this._createBackground(this._config.background);
    if (this._backgroundMesh) this._scene.add(this._backgroundMesh);

    // Una vez construidos todos, los distribuimos en horizontal
    this.layoutPanelsHorizontally(10); // gap fijo entre paneles (ajusta a gusto)
    this._rig = new CameraRig(this._camera, this._rootGroup);
    this._rig.focusOverview(this._rootGroup);

    // InteractionManager se encarga de hover/click + raycaster
    this._interaction = new InteractionManager({
      camera: this._camera,
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

    // 4. Empezar loop
    this.animate();
  }

  /**
   * Crea un plano de fondo en el mundo, detrás de todos los paneles,
   * usando una textura. El fondo se mueve con el rootGroup, no con la cámara.
   */
  private _createBackground(background?: string) {
    if (!this._rootGroup) return;
    if (!background) return;

    // Calculamos el bounding box del contenido para dimensionar el fondo
    const box = new THREE.Box3().setFromObject(this._rootGroup);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    // Valores por defecto por si aún no hay nada en el rootGroup
    const width = (size.x || 10) * 10;
    const height = (size.y || 10) * 10;

    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load(background); // ajusta la ruta

    // Si tu versión de THREE lo soporta:
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(20, 20);
    const geometry = new THREE.PlaneGeometry(width, height);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      depthWrite: false, // no escribe en z-buffer, pero sí hace depthTest por defecto
    });

    const mesh = new THREE.Mesh(geometry, material);

    // Lo centramos respecto al contenido y lo mandamos "al fondo"
    mesh.position.set(center.x, center.y, -20);
    mesh.renderOrder = -10; // se dibuja antes que el resto

    this._backgroundMesh = mesh;

    // 👇 Importante: fondo pegado al mundo, no a la cámara
    this._rootGroup.add(mesh);
  }

  private setupLights() {
    const ambient = new THREE.AmbientLight(0x404040, 0.1);
    this._scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2);
    dirLight.position.set(3, 5, 8);
    this._scene.add(dirLight);
  }

  private buildModels(models: ModelNode[]) {
    const factory = new PanelFactory();

    this._panelResults = [];
    this._panelWidths = [];

    models.forEach((model, i) => {
      const { group, layers, neurons }: PanelResult = factory.createNN(
        model,
        i,
        models.length,
        true,
        this._config,
      );

      // En vez de añadir directamente a la escena, lo añadimos al rootGroup
      this._rootGroup.add(group);

      // Guardamos el PanelResult para luego recolocarlo
      this._panelResults.push({ group, layers, neurons });

      // Calculamos el ancho real del panel
      const box = new THREE.Box3().setFromObject(group);
      const size = new THREE.Vector3();
      box.getSize(size);
      this._panelWidths.push(size.x);

      const panel: Panel = group.getObjectByName("panel") as Panel;
      if (panel) {
        this._models.push(panel);
      }
      this._layers = this._layers.concat(layers);

      if (model.layers && neurons.length) {
        let offset = 0;
        model.layers.forEach((layer) => {
          layer.neurons.forEach((_, neuronIndex) => {
            const mesh = neurons[offset + neuronIndex];
            if (!mesh) return;
            this._neurons.push(mesh);
          });
          offset += layer.neurons.length;
        });
      }
    });
  }

  // Distribuye los paneles en horizontal con una separación fija entre bounding boxes
  private layoutPanelsHorizontally(gap: number) {
    if (!this._panelResults.length) return;

    const totalWidth =
      this._panelWidths.reduce((acc, w) => acc + w, 0) +
      gap * (this._panelWidths.length - 1);

    let cursorX = -totalWidth / 2;

    this._panelResults.forEach((panelResult, index) => {
      const w = this._panelWidths[index];
      const centerX = cursorX + w / 2;

      // Sobrescribimos cualquier posición X que viniera de createNN
      panelResult.group.position.x = centerX;

      cursorX += w + gap;
    });
  }

  private onResize() {
    const rect = this._container.getBoundingClientRect();
    const aspect = rect.width / rect.height;
    const frustumSize = 10;

    const ortho = this._camera as THREE.OrthographicCamera;

    ortho.left = (-frustumSize * aspect) / 2;
    ortho.right = (frustumSize * aspect) / 2;
    ortho.top = frustumSize / 2;
    ortho.bottom = -frustumSize / 2;
    ortho.updateProjectionMatrix();

    this._renderer.setSize(rect.width, rect.height);
    const model: THREE.Mesh = this._interaction.getFocusedModel() as THREE.Mesh;
    if (this._interaction.getCurrentMode() === "overview") {
      this._rig.focusOverview();
    } else if (model) {
      this._rig.focusOnObject(model);
    }
  }

  private animate = () => {
    this._animationId = requestAnimationFrame(this.animate);
    const t: number = performance.now();
    this._neurons.forEach((n) => n.update(t));
    this._rig.update(t);
    this._renderer.render(this._scene, this._camera);
  };

  public dispose() {
    cancelAnimationFrame(this._animationId);

    window.removeEventListener("resize", this._handleResizeBound);
    this._interaction.dispose();

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
  }

  public goto(
    model: "jobs" | "education" | null = null,
    layer: string | null = null,
    neuron: string | null = null,
  ) {
    if (!model) {
      this._interaction.setMode("overview");
      this._rig.focusOverview();
      return;
    }
    if (!layer) {
      const panel: Panel = this._models.filter(
        (p) => p.parent?.name === model,
      )[0];
      this._interaction.setMode("modelFocus", panel);
      this._rig.focusOnObject(panel);
      return;
    }
    if (!neuron) {
      const panel: Panel = this._layers.filter(
        (p) => p.parent?.name === layer,
      )[0];
      this._interaction.setMode("layerFocus", panel);
      this._rig.focusOnObject(panel);
      return;
    }
    if (model && layer && neuron) {
      const mesh: Neuron = this._neurons.filter(
        (n) =>
          n.userData.modelId === model &&
          n.userData.layerId === layer &&
          n.userData.neuronId === neuron,
      )[0];
      this._interaction.setMode("neuronFocus", mesh);
      this._rig.focusOnObject(mesh);
    }
  }
}

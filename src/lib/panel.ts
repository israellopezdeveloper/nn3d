import * as THREE from "three";

interface PanelOptions {
  width: number;
  height: number;
  name: string;
  userData?: any;
  color?: THREE.Color | number | string;
}

export class Panel extends THREE.Mesh {
  private _baseColor: THREE.Color;
  private _offOpacity = 0.0; // completamente transparente
  private _onOpacity = 0.15; // opacidad cuando está en hover
  private _onEmissiveIntensity = 2.0; // intensidad de glow en hover

  constructor(options: PanelOptions) {
    const { width, height, name, userData = {}, color = 0x55ff55 } = options;

    const geometry = new THREE.PlaneGeometry(width, height);
    const baseColor = new THREE.Color(color);

    const material = new THREE.MeshStandardMaterial({
      color: baseColor,
      transparent: true,
      opacity: 0.0, // empieza transparente
      emissive: baseColor.clone(),
      emissiveIntensity: 0.0, // sin glow al inicio
      side: THREE.DoubleSide,
      metalness: 0.0,
      roughness: 0.0,
    });

    super(geometry, material);

    this.name = name;
    this.userData = userData;
    this._baseColor = baseColor;
    this.castShadow = false;
    this.receiveShadow = false;
    this.visible = false;
  }

  /** Hace que el panel "brille" del color base (hover ON) */
  public hoverIn(): void {
    const mat = this.material as THREE.MeshStandardMaterial;
    mat.opacity = this._onOpacity;
    mat.emissive.copy(this._baseColor);
    mat.emissiveIntensity = this._onEmissiveIntensity;
  }

  /** Vuelve al estado totalmente transparente (hover OFF) */
  public hoverOut(): void {
    const mat = this.material as THREE.MeshStandardMaterial;
    mat.opacity = this._offOpacity;
    mat.emissiveIntensity = 0.0;
    this.visible = false;
    this.castShadow = false;
    this.receiveShadow = false;
  }

  /** Mostrar el panel (sigue respetando opacity/hover) */
  public show(): void {
    this.visible = true;
    this.castShadow = false;
    this.receiveShadow = false;
  }

  /** Ocultar el panel por completo */
  public hide(): void {
    this.visible = false;
    this.castShadow = false;
    this.receiveShadow = false;
  }

  /** Cambiar userData externamente */
  public setUserData(data: any): void {
    this.userData = data;
  }
}

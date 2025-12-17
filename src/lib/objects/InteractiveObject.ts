import * as THREE from "three";

export abstract class Hoverable extends THREE.Group {
  protected readonly highlight: THREE.Mesh<
    THREE.BoxGeometry,
    THREE.MeshBasicMaterial
  >;

  constructor(highlightColor: THREE.Color | number) {
    super();

    this.highlight = this.createHighlightMesh(highlightColor);
    this.add(this.highlight);

    // OJO: solo si ya tienes hijos añadidos en este punto.
    // Si no, llama a this.recomputeHighlight() al final del build().
    this.fitHighlightToContent();
  }

  abstract onHoverIn(): void;
  abstract onHoverOut(): void;

  // Si quieres, expón un método público/protegido para recalcular cuando cambie el contenido
  protected recomputeHighlight(): void {
    this.fitHighlightToContent();
  }

  protected fitHighlightToContent(): void {
    const prev = this.highlight.visible;
    this.highlight.visible = false;

    const box = new THREE.Box3().setFromObject(this);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    size.x = Math.max(size.x, 0.6);
    size.y = Math.max(size.y, 0.6);
    size.z = Math.max(size.z, 0.2);

    this.highlight.geometry.dispose();
    this.highlight.geometry = new THREE.BoxGeometry(
      size.x * 1.05,
      size.y * 1.05,
      size.z * 1.05,
    );

    this.highlight.position.copy(this.worldToLocal(center.clone()));
    this.highlight.visible = prev;
  }

  protected createHighlightMesh(
    highlightColor: THREE.Color | number,
  ): THREE.Mesh<THREE.BoxGeometry, THREE.MeshBasicMaterial> {
    const geom = new THREE.BoxGeometry(1, 1, 1);
    const mat = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
      color: highlightColor,
    });

    const mesh = new THREE.Mesh(geom, mat);
    mesh.name = `${this.name}:highlight`;
    mesh.visible = false;
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    return mesh;
  }
}

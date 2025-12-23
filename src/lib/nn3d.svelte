<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { SceneManager } from "./scene-manager.ts";
  import type {
    ModelNode,
    LayerNode,
    NeuronNode,
    NN3DInterface,
  } from "./types.ts";

  // Runes: usamos $props() en vez de export let
  let {
    models,
    background,
    neuronOutColor,
    neuronInColor,
    neuronFogColor,
    highlightColor,
    lineColor,
    neuronSpacing,
    layerSpacing,
    onNothingSelect,
    onModelSelect,
    onLayerSelect,
    onNeuronSelect,
  }: NN3DInterface = $props();

  let container: HTMLDivElement;
  let manager: SceneManager | null = null;

  onMount(() => {
    if (!container) return;

    manager = new SceneManager(container, {
      models,
      background: background,
      neuronOutColor: neuronOutColor ?? 0x0033ff,
      neuronInColor: neuronInColor ?? 0x66ccff,
      neuronFogColor: neuronFogColor ?? 0x0088ff,
      highlightColor: highlightColor ?? 0x00aaff,
      lineColor: lineColor ?? 0x6ae3ff,
      neuronSpacing: neuronSpacing ?? 1.8,
      layerSpacing: layerSpacing ?? 2.5,
      onNothingSelect: () => onNothingSelect?.(),
      onModelSelect: (info: ModelNode) => onModelSelect?.(info),
      onLayerSelect: (modelId: string, info: LayerNode) =>
        onLayerSelect?.(modelId, info),
      onNeuronSelect: (modelId: string, layerId: string, info: NeuronNode) =>
        onNeuronSelect?.(modelId, layerId, info),
    });
  });

  onDestroy(() => {
    manager?.dispose();
  });

  export function goto(
    model: string | null = null,
    layer: string | null = null,
    neuron: string | null = null,
  ) {
    manager?.goto(model, layer, neuron);
  }
</script>

<div
  bind:this={container}
  style="width:100%; height:100%;background-color:#00000000"
></div>

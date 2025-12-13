<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { SceneManager } from "./scene-manager.ts";
  import type {
    ModelInfo,
    LayerInfo,
    NeuronInfo,
    NN3DInterface,
  } from "./types.ts";

  // Runes: usamos $props() en vez de export let
  let {
    models,
    background,
    onNothingSelect,
    onModelSelect,
    onLayerSelect,
    onNeuronSelect,
    neuronOutColor,
    neuronInColor,
    neuronFogColor,
    lineColor,
  }: NN3DInterface = $props();

  let container: HTMLDivElement;
  let manager: SceneManager | null = null;

  onMount(() => {
    if (!container) return;

    manager = new SceneManager(container, {
      models,
      onNothingSelect: () => onNothingSelect?.(),
      onModelSelect: (info: ModelInfo) => onModelSelect?.(info),
      onLayerSelect: (info: LayerInfo) => onLayerSelect?.(info),
      onNeuronSelect: (info: NeuronInfo) => onNeuronSelect?.(info),
      neuronOutColor: neuronOutColor ?? 0x0033ff,
      neuronInColor: neuronInColor ?? 0x66ccff,
      neuronFogColor: neuronFogColor ?? 0x0088ff,
      lineColor: lineColor ?? 0x6ae3ff,
      background: background,
    });
  });

  onDestroy(() => {
    manager?.dispose();
  });

  export function goto(
    model: "jobs" | "education" | null = null,
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

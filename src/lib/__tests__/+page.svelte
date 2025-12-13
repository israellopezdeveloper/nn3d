<script lang="ts">
  import Nn3d from "$lib/nn3d.svelte";

  const models = [
    {
      id: "model-1",
      label: "Model 1",
      layers: [
        {
          id: "layer-1",
          label: "Layer 1",
          neurons: [{ id: "n-1", label: "Neuron 1" }],
        },
      ],
    },
  ];

  let events: string[] = [];
  let api: any;

  function push(e: string) {
    events = [...events, e];
    // Exponemos en window para que Playwright lea
    (window as any).__NN3D_EVENTS__ = events;
  }

  (window as any).__NN3D_EVENTS__ = events;

  function doGoto() {
    api?.goto?.("model-1", "layer-1", "n-1");
  }

  (window as any).__NN3D_GOTO__ = doGoto;
</script>

<div style="height: 80vh;">
  <Nn3d
    bind:this={api}
    {models}
    onNothingSelect={() => push("nothing")}
    onModelSelect={() => push("model")}
    onLayerSelect={() => push("layer")}
    onNeuronSelect={() => push("neuron")}
  />
</div>

<button on:click={doGoto} data-testid="goto-btn">goto</button>
<div data-testid="events">{events.join(",")}</div>

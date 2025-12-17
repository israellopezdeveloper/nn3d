# NN3D – Interactive 3D Neural Network Visualization for Svelte

![npm](https://img.shields.io/npm/v/@israellopezdeveloper/nn3d)

**nn3d** is a lightweight, interactive **3D neural network visualization component** built for modern frontend applications.  
It is designed to visually represent hierarchical structures such as **models, layers, and neurons**, with smooth camera transitions and rich interaction callbacks.

The library is framework-agnostic at its core, and integrates seamlessly with **Svelte / SvelteKit**.

## Features

- 🧠 3D visualization of neural network–like structures
- 🎥 Smooth camera navigation between models, layers, and neurons
- 🖱️ Click interaction at different hierarchy levels
- 🎨 Customizable colors, spacing, and layout
- ⚡ GPU-accelerated rendering (Three.js under the hood)
- 🧩 Designed for composability and clean integration

## Installation

```bash
npm install @israellopezdeveloper/nn3d
```

or

```bash
pnpm add @israellopezdeveloper/nn3d
```

## Basic Usage (Svelte / SvelteKit)

Below is a **minimal but complete example** showing how to mount the component, handle interactions, and programmatically navigate the scene.

### Example

```ts
<script lang="ts">
  import { onMount } from 'svelte';
  import favicon from '$lib/assets/favicon.svg';
  import { models } from '$lib/model/nn';

  import {
    Nn3d,
    type NeuronNode,
    type LayerNode,
    type ModelNode
  } from '@israellopezdeveloper/nn3d';

  let nn: Nn3d;

  function callback0() {
    console.log('Nothing selected');
  }

  function callback1(info: ModelNode) {
    console.log('MODEL  - ', info);
  }

  function callback2(info: LayerNode) {
    console.log('LAYER  - ', info);
  }

  function callback3(info: NeuronNode) {
    console.log('NEURON - ', info);
  }

  onMount(() => {
    setTimeout(() => {
      nn?.goto('works');

      setTimeout(() => {
        nn?.goto('education', 'university');

        setTimeout(() => {
          nn?.goto(
            'works',
            'Indra',
            'Collaboration on Artificial Intelligence modules'
          );

          setTimeout(() => {
            nn?.goto(); // reset camera
          }, 2000);

        }, 2000);
      }, 2000);
    }, 2000);
  });
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

<div class="background">
  <Nn3d
    bind:this={nn}
    {models}
    background={'/background1.png'}
    onNothingSelect={callback0}
    onModelSelect={callback1}
    onLayerSelect={callback2}
    onNeuronSelect={callback3}
    neuronOutColor={0x7fb9ff}
    neuronInColor={0x4defff}
    lineColor={0x303055}
    neuronSpacing={2}
    layerSpacing={2.5}
  />
</div>

<div class="content">
  {@render children()}
</div>

<style>
  .background {
    position: fixed;
    inset: 0;
    z-index: -1;
  }

  .content {
    position: relative;
    z-index: 1;
    color: white;
    padding: 2rem;
  }
</style>
```

## Data Model

`nn3d` expects a hierarchical structure composed of:

- **Models**
- **Layers**
- **Neurons**

These are represented internally by:

- `ModelNode`
- `LayerNode`
- `NeuronNode`

Each interaction callback receives the corresponding node metadata, allowing you to:

- Update UI state
- Display contextual information
- Trigger navigation or animations
- Synchronize with external content

## Programmatic Navigation

The component exposes a `goto()` method for camera navigation:

```ts
nn.goto(); // reset view
nn.goto(modelId);
nn.goto(modelId, layerId);
nn.goto(modelId, layerId, neuronId);
```

This allows you to build guided tours, timelines, or narrative-driven visualizations.

## Customization Options

| Prop             | Description                 |
| ---------------- | --------------------------- |
| `background`     | Background image or texture |
| `neuronOutColor` | Color for output neurons    |
| `neuronInColor`  | Color for input neurons     |
| `lineColor`      | Connection line color       |
| `neuronSpacing`  | Distance between neurons    |
| `layerSpacing`   | Distance between layers     |

## Use Cases

- Interactive portfolios
- AI / ML education visualizations
- Explainable AI demos
- Architectural diagrams
- Story-driven technical presentations

## License

MIT License with Attribution Requirement

If you use this project, you must provide attribution to:
**Israel López**  
https://github.com/israellopezdeveloper

## Author

**Israel López**

Senior Backend & AI Engineer

- GitHub: [https://github.com/israellopezdeveloper](https://github.com/israellopezdeveloper)
- npm: [https://www.npmjs.com/package/@israellopezdeveloper/nn3d](https://www.npmjs.com/package/@israellopezdeveloper/nn3d)

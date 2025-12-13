# NN3D – Interactive 3D Neural Network Visualization for Svelte

![npm](https://img.shields.io/npm/v/@israellopezdeveloper/nn3d)

**NN3D** is a Svelte component that renders an interactive 3D neural-network–like structure using Three.js.  
It is designed to visually represent hierarchical AI models (models → layers → neurons) and allows both **user interaction** and **programmatic navigation**.

This component is ideal for portfolios, educational content, AI visualizations, or interactive storytelling.

## Features

- 3D visualization of hierarchical AI structures
- Clickable **models**, **layers**, and **neurons**
- Programmatic navigation with `goto(...)`
- Smooth camera transitions
- Fully typed (TypeScript)
- Easy integration in Svelte / SvelteKit
- Customizable colors

## Installation

Install the package from **npm**:

```bash
npm install @israellopezdeveloper/nn3d
```

or with pnpm:

```bash
pnpm add @israellopezdeveloper/nn3d
```

or yarn:

```bash
yarn add @israellopezdeveloper/nn3d
```

## Basic Usage

Below is a **minimal working example** showing how to use the component, listen to selection events, and control navigation programmatically.

### Example Component

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import favicon from '$lib/assets/favicon.svg';
  import { models } from '$lib/model/ai-structure';
  import {
    Nn3d,
    type NeuronInfo,
    type LayerInfo,
    type ModelInfo
  } from '@israellopezdeveloper/nn3d';

  let nn: Nn3d;

  function callback0() {
    console.log('ALL');
  }

  function callback1(id: ModelInfo) {
    console.log('MODEL  - ', id);
  }

  function callback2(id: LayerInfo) {
    console.log('LAYER  - ', id);
  }

  function callback3(id: NeuronInfo) {
    console.log('NEURON - ', id);
  }

  onMount(() => {
    setTimeout(() => {
      nn?.goto('jobs');
      setTimeout(() => {
        nn?.goto('education', 'university');
        setTimeout(() => {
          nn?.goto('jobs', 'job4', 'project6');
          setTimeout(() => {
            nn?.goto();
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
    onNothingSelect={callback0}
    onModelSelect={callback1}
    onLayerSelect={callback2}
    onNeuronSelect={callback3}
    neuronOutColor={0x7fb9ff}
    neuronInColor={0x4defff}
    lineColor={0x303055}
  />
</div>

<div class="content">
  <slot />
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

## Props

| Prop              | Type                         | Description                                      |
| ----------------- | ---------------------------- | ------------------------------------------------ |
| `models`          | `ModelInfo[]`                | Hierarchical data structure defining the network |
| `onNothingSelect` | `() => void`                 | Called when nothing is selected                  |
| `onModelSelect`   | `(info: ModelInfo) => void`  | Called when a model is selected                  |
| `onLayerSelect`   | `(info: LayerInfo) => void`  | Called when a layer is selected                  |
| `onNeuronSelect`  | `(info: NeuronInfo) => void` | Called when a neuron is selected                 |
| `neuronOutColor`  | `number`                     | Color for output neurons (hex)                   |
| `neuronInColor`   | `number`                     | Color for input neurons (hex)                    |
| `lineColor`       | `number`                     | Color for connections                            |

## Programmatic Navigation (`goto`)

The component exposes a `goto(...)` method via `bind:this`.

### Method Signature

```ts
goto(modelId?: string, layerId?: string, neuronId?: string): void
```

### Examples

```ts
nn.goto(); // Reset view (nothing selected)

nn.goto("jobs"); // Focus a model

nn.goto("education", "university"); // Focus a layer

nn.goto("jobs", "job4", "project6"); // Focus a neuron
```

This allows you to drive the visualization from:

- UI controls
- Timelines
- Scroll events
- Tutorials or guided demos

## Styling Notes

- The NN3D canvas is intended to be placed **as a background**
- Content can be layered above it using z-index
- The component automatically handles resizing

## Requirements

- Svelte 5 (Runes compatible)
- Modern browser with WebGL support

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

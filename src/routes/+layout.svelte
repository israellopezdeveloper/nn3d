<script lang="ts">
	import favicon from "$lib/assets/favicon.svg";
	import { models } from "$lib/assets/model";
	import {
		Nn3d,
		type NeuronNode,
		type LayerNode,
		type ModelNode,
	} from "@israellopezdeveloper/nn3d";

	let { children } = $props();
	let nn: Nn3d;

	function callback0() {
		console.log("ALL");
	}
	function callback1(info: ModelNode) {
		console.log("MODEL  - ", info);
	}
	function callback2(info: LayerNode) {
		console.log("LAYER  - ", info);
	}
	function callback3(info: NeuronNode) {
		console.log("NEURON - ", info);
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="background">
	<Nn3d
		bind:this={nn}
		{models}
		background={"/background1.png"}
		onNothingSelect={callback0}
		onModelSelect={callback1}
		onLayerSelect={callback2}
		onNeuronSelect={callback3}
		neuronOutColor={0x7fb9ff}
		neuronInColor={0x4defff}
		lineColor={0x303055}
		neuronSpacing={2}
		layerSpacing={4}
	></Nn3d>
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

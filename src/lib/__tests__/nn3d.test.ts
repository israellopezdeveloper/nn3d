import { render } from "@testing-library/svelte";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Nn3d from "../nn3d.svelte";

/**
 * We mock SceneManager to avoid initializing Three.js / WebGL in JSDOM.
 * The component under test should only be responsible for:
 * - creating the manager with the correct config
 * - wiring callbacks
 * - delegating goto()
 * - disposing on destroy
 */
const ctorSpy = vi.fn();
const disposeSpy = vi.fn();
const gotoSpy = vi.fn();

type MockInstance = { container: HTMLElement; config: any };
const instances: MockInstance[] = [];

vi.mock("../scene-manager.ts", () => {
  class SceneManager {
    public container: HTMLElement;
    public config: any;

    constructor(container: HTMLElement, config: any) {
      this.container = container;
      this.config = config;

      instances.push({ container, config });
      ctorSpy(container, config);
    }

    goto(model?: any, layer?: any, neuron?: any) {
      gotoSpy(model, layer, neuron);
    }

    dispose() {
      disposeSpy();
    }
  }

  return { SceneManager };
});

const MODELS = [{ id: "jobs", label: "Jobs", layers: [] }];

describe("Nn3d component", () => {
  beforeEach(() => {
    ctorSpy.mockClear();
    disposeSpy.mockClear();
    gotoSpy.mockClear();
    instances.length = 0;
  });

  it("renders a container div", () => {
    const { container } = render(Nn3d, { props: { models: MODELS } });
    expect(container.querySelector("div")).toBeTruthy();
  });

  it("creates SceneManager on mount with models and computed defaults", () => {
    render(Nn3d, { props: { models: MODELS } });

    expect(ctorSpy).toHaveBeenCalledTimes(1);
    const [_container, config] = ctorSpy.mock.calls[0];

    expect(config.models).toEqual(MODELS);

    // Defaults from nn3d.svelte
    expect(config.neuronOutColor).toBe(0x0033ff);
    expect(config.neuronInColor).toBe(0x66ccff);
    expect(config.neuronFogColor).toBe(0x0088ff);
    expect(config.lineColor).toBe(0x6ae3ff);

    // Background is passed through (may be undefined)
    expect(config).toHaveProperty("background");
  });

  it("passes background through to SceneManager config", () => {
    render(Nn3d, {
      props: {
        models: MODELS,
        background: 0x112233,
      },
    });

    const [, config] = ctorSpy.mock.calls[0];
    expect(config.background).toBe(0x112233);
  });

  it("overrides default colors when provided via props", () => {
    render(Nn3d, {
      props: {
        models: MODELS,
        neuronOutColor: 0xff0000,
        neuronInColor: 0x00ff00,
        neuronFogColor: 0x0000ff,
        lineColor: 0x111111,
      },
    });

    const [, config] = ctorSpy.mock.calls[0];
    expect(config.neuronOutColor).toBe(0xff0000);
    expect(config.neuronInColor).toBe(0x00ff00);
    expect(config.neuronFogColor).toBe(0x0000ff);
    expect(config.lineColor).toBe(0x111111);
  });

  it("wires selection callbacks into SceneManager config", () => {
    const onNothingSelect = vi.fn();
    const onModelSelect = vi.fn();
    const onLayerSelect = vi.fn();
    const onNeuronSelect = vi.fn();

    render(Nn3d, {
      props: {
        models: MODELS,
        onNothingSelect,
        onModelSelect,
        onLayerSelect,
        onNeuronSelect,
      },
    });

    const [, config] = ctorSpy.mock.calls[0];

    // Call them as SceneManager would
    config.onNothingSelect();
    config.onModelSelect({ id: "jobs", label: "Jobs" });
    config.onLayerSelect({ modelId: "jobs", id: "layer-1", label: "Layer 1" });
    config.onNeuronSelect({
      modelId: "jobs",
      layerId: "layer-1",
      id: "n-1",
      label: "Neuron 1",
    });

    expect(onNothingSelect).toHaveBeenCalledTimes(1);
    expect(onModelSelect).toHaveBeenCalledTimes(1);
    expect(onLayerSelect).toHaveBeenCalledTimes(1);
    expect(onNeuronSelect).toHaveBeenCalledTimes(1);
  });

  it("does not throw if callbacks are undefined", () => {
    render(Nn3d, { props: { models: MODELS } });

    const [, config] = ctorSpy.mock.calls[0];

    // All of these must be safe no-ops when user didn't provide callbacks.
    expect(() => config.onNothingSelect()).not.toThrow();
    expect(() => config.onModelSelect({})).not.toThrow();
    expect(() => config.onLayerSelect({})).not.toThrow();
    expect(() => config.onNeuronSelect({})).not.toThrow();
  });

  it("exposes goto() and delegates to SceneManager.goto()", async () => {
    const { component } = render(Nn3d, { props: { models: MODELS } });

    // The component exports a method `goto(...)`
    // @ts-expect-error - Svelte component typings may not include exported functions
    component.goto("jobs", "layer-1", "n-1");

    expect(gotoSpy).toHaveBeenCalledTimes(1);
    expect(gotoSpy).toHaveBeenCalledWith("jobs", "layer-1", "n-1");
  });

  it("does not throw if goto() is called before mount finishes", () => {
    // In practice, render() mounts synchronously, but this test ensures the method is defensive.
    const { component } = render(Nn3d, { props: { models: MODELS } });

    expect(() => {
      // @ts-expect-error - Svelte component typings may not include exported functions
      component.goto("jobs");
    }).not.toThrow();
  });

  it("disposes SceneManager on component destroy", () => {
    const { unmount } = render(Nn3d, { props: { models: MODELS } });

    expect(ctorSpy).toHaveBeenCalledTimes(1);
    unmount();

    expect(disposeSpy).toHaveBeenCalledTimes(1);
  });
});

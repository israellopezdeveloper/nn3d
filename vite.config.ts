import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [sveltekit()],

  // 👇 Esto evita que Vitest importe `svelte/index-server`
  resolve: {
    conditions: process.env.VITEST ? ["browser"] : [],
  },

  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
  },
});

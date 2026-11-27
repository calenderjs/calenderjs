import { defineConfig, mergeConfig } from "vite";
import { resolve } from "node:path";
import demoConfig from "./vite.config";

export default defineConfig(async (env) =>
  mergeConfig(
    typeof demoConfig === "function" ? await demoConfig(env) : demoConfig,
    { build: { outDir: "dist-e2e", rollupOptions: { input: { demo: resolve(__dirname, "index.html") } } } },
  ),
);

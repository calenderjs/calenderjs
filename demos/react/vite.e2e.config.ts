import { defineConfig, mergeConfig } from "vite";
import { resolve } from "node:path";
import demoConfig from "./vite.config";

// 测试契约页只加入隔离构建，普通 demo 产物不包含测试入口。
export default defineConfig(async env => mergeConfig(
  typeof demoConfig === "function" ? await demoConfig(env) : demoConfig,
  {
    build: {
      outDir: "dist-e2e",
      rollupOptions: {
        input: {
          demo: resolve(__dirname, "index.html"),
          wrapper: resolve(__dirname, "e2e/harness/index.html"),
        },
      },
    },
  },
));

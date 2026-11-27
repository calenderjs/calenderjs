import { defineConfig, type AliasOptions } from "vite";
import path from "path";
import vue from "@vitejs/plugin-vue";
import { wsx } from "@wsxjs/wsx-vite-plugin";

const DEMO_DEV_PORT = 5205;

export default defineConfig(({ command, mode }) => {
  const isDev = command === "serve" || mode === "development";
  const rootDir = path.resolve(__dirname, "../..");

  const baseAliases: AliasOptions = {
    "@": path.resolve(__dirname, "./src"),
  };

  // 开发模式下指向源码，实现热重载
  const devAliases: AliasOptions = isDev
    ? {
        "@calenderjs/calendar": path.resolve(rootDir, "packages/calendar/src/index.ts"),
        "@calenderjs/core": path.resolve(rootDir, "packages/core/src/index.ts"),
        "@calenderjs/event-model": path.resolve(rootDir, "packages/event-model/src/index.ts"),
        "@calenderjs/vue": path.resolve(rootDir, "packages/vue/src/index.ts"),
      }
    : {};

  return {
    plugins: [
      vue({
        template: {
          compilerOptions: {
            isCustomElement: (tag) => tag === "wsx-calendar",
          },
        },
      }),
      // calendar 包源码是 .wsx，开发模式走源码别名时需要这个插件转译
      ...(isDev ? [wsx({ debug: false, jsxFactory: "jsx", jsxFragment: "Fragment" })] : []),
    ],
    resolve: { alias: { ...baseAliases, ...devAliases } },
    server: { port: DEMO_DEV_PORT, strictPort: true, open: true },
    build: { outDir: "dist", sourcemap: true },
  };
});

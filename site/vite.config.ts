import { defineConfig, Plugin } from "vite";
import { wsx } from "@wsxjs/wsx-vite-plugin";
import { wsxPress } from "@wsxjs/wsx-press/node";
import UnoCSS from "unocss/vite";
import path from "path";
import { fileURLToPath } from "url";
import { existsSync, cpSync } from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** 构建后复制 .wsx-press 到 dist */
function copyWsxPressPlugin(): Plugin {
  return {
    name: "copy-wsx-press",
    apply: "build",
    closeBundle() {
      const wsxPressPath = path.resolve(__dirname, ".wsx-press");
      const distPath = path.resolve(__dirname, "dist/.wsx-press");
      if (existsSync(wsxPressPath)) {
        cpSync(wsxPressPath, distPath, { recursive: true, force: true });
        console.log("✅ Copied .wsx-press to dist");
      }
    },
  };
}

export default defineConfig({
  base: "/",
  plugins: [
    wsxPress({
      docsRoot: path.resolve(__dirname, "./public/docs"),
      outputDir: path.resolve(__dirname, "./.wsx-press"),
    }),
    UnoCSS(),
    wsx({ debug: false, jsxFactory: "h", jsxFragment: "Fragment" }),
    copyWsxPressPlugin(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      ...(process.env.NODE_ENV === "development"
        ? {
            "@calenderjs/calendar": path.resolve(
              __dirname,
              "../packages/calendar/src/index.ts",
            ),
            "@calenderjs/event-dsl": path.resolve(
              __dirname,
              "../packages/event-dsl/src/index.ts",
            ),
            "@calenderjs/event-model": path.resolve(
              __dirname,
              "../packages/event-model/src/index.ts",
            ),
            "@calenderjs/event-runtime": path.resolve(
              __dirname,
              "../packages/event-runtime/src/index.ts",
            ),
          }
        : {}),
    },
  },
  server: {
    port: 5179,
    open: true,
  },
  build: {
    outDir: "dist",
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: [
            "@wsxjs/wsx-core",
            "@wsxjs/wsx-base-components",
            "@wsxjs/wsx-router",
          ],
          calenderjs: [
            "@calenderjs/calendar",
            "@calenderjs/event-dsl",
            "@calenderjs/event-runtime",
          ],
        },
      },
    },
  },
});

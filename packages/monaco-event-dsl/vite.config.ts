import { defineConfig } from "vite";
import { resolve } from "path";
import dts from "vite-plugin-dts";

export default defineConfig({
  build: {
    outDir: "./dist",
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "CalenderJSMonacoEventDSL",
      formats: ["es", "cjs"],
      fileName: (format) => `index.${format === "es" ? "mjs" : "cjs"}`,
    },
    rollupOptions: {
      // monaco 由宿主提供（peer），含子路径
      external: [/^monaco-editor(\/.*)?$/],
      output: {
        globals: {
          "monaco-editor": "monaco",
        },
      },
    },
    cssCodeSplit: false,
    sourcemap: true,
  },
  plugins: [
    dts({
      insertTypesEntry: true,
      include: ["src/**/*"],
      exclude: ["src/**/__tests__/**"],
    }),
  ],
});

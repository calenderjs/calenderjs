import { defineConfig } from "vite";
import { resolve } from "path";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
      include: ["src/**/*"],
      exclude: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    }),
  ],
  build: {
    outDir: "./dist",
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "CalenderJSReactEventEditor",
      formats: ["es", "cjs"],
      fileName: (format) => `index.${format === "es" ? "mjs" : "cjs"}`,
    },
    rollupOptions: {
      // React / Monaco 全外部化 — 库产物禁止内联，避免宿主多副本与 React 19 炸
      external: [
        /^react(\/.*)?$/,
        /^react-dom(\/.*)?$/,
        /^@monaco-editor\/react(\/.*)?$/,
        /^monaco-editor(\/.*)?$/,
        "@calenderjs/monaco-event-dsl",
      ],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          "@calenderjs/monaco-event-dsl": "CalenderJSMonacoEventDSL",
          "@monaco-editor/react": "MonacoEditorReact",
          "monaco-editor": "monaco",
        },
      },
    },
    cssCodeSplit: false,
    sourcemap: true,
    minify: false,
  },
});

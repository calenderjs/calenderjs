import { defineConfig } from "vite";
import { resolve } from "path";
import vue from "@vitejs/plugin-vue";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag === "wsx-calendar",
        },
      },
    }),
    dts({
      insertTypesEntry: true,
    }),
  ],
  build: {
    outDir: "./dist",
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "CalenderJSVue",
      formats: ["es", "cjs"],
      fileName: (format) => `index.${format === "es" ? "mjs" : "cjs"}`,
    },
    rollupOptions: {
      // Vue 与 workspace 包一律 external — 库禁止内联宿主框架/兄弟包
      external: [/^vue$/, /^@calenderjs\//],
      output: {
        globals: {
          vue: "Vue",
          "@calenderjs/calendar": "CalenderJSCalendar",
        },
      },
    },
    cssCodeSplit: false,
    sourcemap: true,
    minify: false,
  },
});

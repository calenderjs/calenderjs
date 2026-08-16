import { defineConfig } from "vite";
import { resolve } from "path";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
    }),
  ],
  build: {
    outDir: "./dist",
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "CalenderJSReact",
      formats: ["es", "cjs"],
      fileName: (format) => `index.${format === "es" ? "mjs" : "cjs"}`,
    },
    rollupOptions: {
      // React 与 workspace 包一律 external — 库禁止内联宿主框架/兄弟包
      external: [/^react(\/.*)?$/, /^react-dom(\/.*)?$/, /^@calenderjs\//],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          "@calenderjs/calendar": "CalenderJSCalendar",
        },
      },
    },
    cssCodeSplit: false,
    // 生成 sourcemap 但确保不会暴露源代码路径给 Next.js
    // Next.js 会通过 package.json exports 使用 dist，不会追溯到源代码
    sourcemap: true,
    minify: false,
  },
});

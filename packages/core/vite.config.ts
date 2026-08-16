import { defineConfig } from "vite";
import { resolve } from "path";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
      include: ["src/**/*"],
      exclude: [
        "src/**/*.test.ts",
        "src/**/__tests__/**",
        "src/Calendar.ts",
        "src/types.ts",
        "src/utils/**",
      ],
    }),
  ],
  build: {
    outDir: "./dist",
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "CalenderJSCore",
      formats: ["es", "cjs"],
      fileName: (format) => {
        if (format === "es") return "index.mjs";
        if (format === "cjs") return "index.cjs";
        return "index";
      },
    },
    rollupOptions: {
      // date-time / event-model 是独立包，禁止内联
      external: [/^@calenderjs\//],
      output: {
        exports: "named",
      },
    },
    cssCodeSplit: false,
    sourcemap: true,
  },
});

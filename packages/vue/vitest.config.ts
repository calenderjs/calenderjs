import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag === "wsx-calendar",
        },
      },
    }),
  ],
  test: {
    globals: true,
    environment: "happy-dom",
    passWithNoTests: true,
  },
});

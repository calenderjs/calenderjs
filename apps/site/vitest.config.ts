import { defineConfig } from "vitest/config";
import { wsx } from "@wsxjs/wsx-vite-plugin";

export default defineConfig({
  plugins: [
    wsx({
      debug: false,
      jsxFactory: "jsx",
      jsxFragment: "Fragment",
    }),
  ],
  test: {
    globals: true,
    environment: "happy-dom",
    passWithNoTests: true,
  },
});

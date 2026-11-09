import { defineConfig, presetUno, presetAttributify } from "unocss";

export default defineConfig({
  presets: [presetUno(), presetAttributify()],
  shortcuts: {
    btn: "px-4 py-2 rounded font-semibold transition-colors",
    "btn-primary": "btn text-white",
    "btn-secondary": "btn bg-gray-500 text-white hover:bg-gray-600",
    container: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",
  },
});

import tseslint from "typescript-eslint";
import vueParser from "vue-eslint-parser";
import vuePlugin from "eslint-plugin-vue";

export default tseslint.config(
  {
    files: ["src/**/*.ts"],
    ignores: ["dist/**", "dist-e2e/**", "coverage/**", "**/*.d.ts"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
        project: "./tsconfig.json",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
    },
  },
  ...vuePlugin.configs["flat/recommended"].map((c) =>
    c.files ? { ...c, files: ["src/**/*.vue"] } : c,
  ),
  {
    files: ["src/**/*.vue"],
    plugins: {
      "@typescript-eslint": tseslint.plugin,
    },
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tseslint.parser,
        ecmaVersion: 2020,
        sourceType: "module",
        extraFileExtensions: [".vue"],
      },
    },
    rules: {
      ...tseslint.configs.recommended.rules,
    },
  },
);

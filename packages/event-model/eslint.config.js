import tseslint from "typescript-eslint";

export default tseslint.config(
    {
        files: ["src/**/*.ts"],
        ignores: ["dist/**", "coverage/**", "**/*.d.ts"],
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
    {
        files: ["**/__tests__/**/*.ts", "**/*.test.ts", "**/*.spec.ts"],
        ignores: ["dist/**", "coverage/**"],
        languageOptions: {
            parser: tseslint.parser,
            parserOptions: {
                ecmaVersion: 2020,
                sourceType: "module",
            },
        },
        plugins: {
            "@typescript-eslint": tseslint.plugin,
        },
        rules: {
            ...tseslint.configs.recommended.rules,
        },
    }
);

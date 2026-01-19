import wsxPlugin from "@wsxjs/eslint-plugin-wsx";
import tseslint from "typescript-eslint";

export default tseslint.config(
    {
        ignores: [
            "dist/**",
            "coverage/**",
            "**/*.d.ts",
            "**/__tests__/**",
            "**/*.test.ts",
            "**/*.spec.ts",
        ],
    },
    {
        files: ["**/*.{ts,tsx}"],
        ignores: ["**/__tests__/**", "**/*.test.ts", "**/*.spec.ts"],
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
        files: ["**/*.wsx"],
        languageOptions: {
            parser: tseslint.parser,
            parserOptions: {
                ecmaVersion: 2020,
                sourceType: "module",
                ecmaFeatures: {
                    jsx: true,
                },
                // 不提供 project，因为 .wsx 文件不在 tsconfig.json 中
            },
        },
        plugins: {
            "@typescript-eslint": tseslint.plugin,
            wsx: wsxPlugin,
        },
        rules: {
            "@typescript-eslint/no-unused-vars": "off",
            "wsx/state-requires-initial-value": "error",
        },
    }
);

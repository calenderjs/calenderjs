import { defineConfig } from "vitest/config";
import { wsx } from "@wsxjs/wsx-vite-plugin";

export default defineConfig({
    plugins: [
        // 添加 WSX 插件以支持 .wsx 文件
        wsx({
            debug: false,
            jsxFactory: "jsx",
            jsxFragment: "Fragment",
        }),
    ],
    test: {
        globals: true,
        environment: "happy-dom", // 使用 happy-dom 环境测试 Web Components
        include: ["src/**/__tests__/**/*.test.ts"],
        coverage: {
            provider: "v8",
            reporter: ["text", "json", "html"],
            include: ["src/**/*.{ts,wsx}"],
            exclude: [
                "node_modules/",
                "dist/",
                "**/*.d.ts",
                "**/*.config.*",
                "**/__tests__/**",
            ],
            lines: 100,
            functions: 100,
            branches: 100,
            statements: 100,
        },
    },
});

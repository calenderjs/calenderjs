import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        globals: true,
        environment: "node",
        include: ["src/**/__tests__/**/*.test.ts"],
        coverage: {
            provider: "v8",
            reporter: ["text", "json", "html"],
            include: ["src/**/*.ts"],
            exclude: [
                "node_modules/",
                "dist/",
                "**/*.d.ts",
                "**/*.config.*",
                "**/__tests__/**",
                "**/generated/**", // 生成的解析器文件
                "src/index.ts", // 导出文件，不需要测试
                "src/types.ts", // 类型定义文件，不需要测试
                "src/ast/index.ts", // 导出文件，不需要测试
                "src/parser/index.ts", // 导出文件，不需要测试
                "src/generators/index.ts", // 导出文件，不需要测试
            ],
            lines: 100,
            functions: 100,
            branches: 100,
            statements: 100,
        },
    },
});

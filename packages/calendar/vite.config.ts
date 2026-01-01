import { defineConfig } from "vite";
import { resolve } from "path";
import dts from "vite-plugin-dts";
import { wsx } from "@wsxjs/wsx-vite-plugin";

export default defineConfig(() => {
    return {
        plugins: [
            wsx({
                debug: false,
                jsxFactory: "jsx",
                jsxFragment: "Fragment",
            }),
            dts({
                insertTypesEntry: true,
                include: ["src/**/*.ts"],
                exclude: [
                    "src/**/*.test.ts",
                    "src/**/__tests__/**",
                    "src/**/*.wsx",
                ],
            }),
        ],
        build: {
            lib: {
                entry: resolve(__dirname, "src/index.ts"),
                name: "CalenderJSCalendar",
                formats: ["es", "cjs"],
                fileName: (format) => {
                    if (format === "es") return "index.mjs";
                    if (format === "cjs") return "index.cjs";
                    return "index";
                },
            },
            rollupOptions: {
                external: [
                    "@calenderjs/core",
                    "@calenderjs/event-dsl",
                    "@wsxjs/wsx-core",
                ],
                input: {
                    index: resolve(__dirname, "src/index.ts"),
                },
                output: {
                    exports: "named",
                    globals: {
                        "@calenderjs/core": "CalenderJSCore",
                        "@calenderjs/event-dsl": "CalenderJSEventDSL",
                        "@wsxjs/wsx-core": "WSXCore",
                    },
                },
            },
            cssCodeSplit: false,
            // 生成 sourcemap 但确保不会暴露源代码路径给 Next.js
            // Next.js 会通过 package.json exports 使用 dist，不会追溯到源代码
            sourcemap: true,
            minify: false,
        },
    };
});

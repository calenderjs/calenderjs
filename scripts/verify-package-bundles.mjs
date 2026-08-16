/**
 * 发布产物边界审计。
 *
 * 确保各库只引用其依赖/peer，不内联 React、WSX、Monaco、AJV
 * 或 workspace 兄弟包的运行时代码。
 */
import { readFile } from "node:fs/promises";

const COMMON_REACT_MARKERS = [
  "ReactCurrentDispatcher",
  "__SECRET_INTERNALS",
  "reactJsxRuntime_production",
];

const PACKAGE_RULES = [
  {
    dir: "packages/react",
    maxBytes: 20_000,
    requiredImports: ["react", "react/jsx-runtime", "@calenderjs/calendar"],
    forbiddenMarkers: [
      ...COMMON_REACT_MARKERS,
      "Invalid date: reactive Proxy Date is not supported",
      "class EventRuntime",
    ],
  },
  {
    dir: "packages/react-event-editor",
    maxBytes: 10_000,
    requiredImports: [
      "react",
      "react/jsx-runtime",
      "@calenderjs/monaco-event-dsl",
    ],
    forbiddenMarkers: [...COMMON_REACT_MARKERS, "monaco-editor/esm"],
  },
  {
    dir: "packages/monaco-event-dsl",
    maxBytes: 20_000,
    requiredImports: [],
    forbiddenMarkers: ["monaco-editor/esm"],
  },
  {
    dir: "packages/calendar",
    maxBytes: 120_000,
    requiredImports: [
      "@wsxjs/wsx-core",
      "@calenderjs/date-time",
      "@calenderjs/event-runtime",
      "@calenderjs/event-dsl",
      "@calenderjs/core",
    ],
    forbiddenMarkers: ["Invalid date: reactive Proxy Date is not supported"],
  },
  {
    dir: "packages/core",
    maxBytes: 15_000,
    requiredImports: ["@calenderjs/date-time"],
    forbiddenMarkers: ["Invalid date: reactive Proxy Date is not supported"],
  },
  {
    dir: "packages/date-time",
    maxBytes: 15_000,
    requiredImports: [],
    forbiddenMarkers: [],
  },
  {
    dir: "packages/event-model",
    maxBytes: 20_000,
    requiredImports: ["ajv", "ajv-formats"],
    forbiddenMarkers: [],
  },
  {
    dir: "packages/event-dsl",
    maxBytes: 70_000,
    requiredImports: [],
    forbiddenMarkers: [],
  },
  {
    dir: "packages/event-runtime",
    maxBytes: 35_000,
    requiredImports: [],
    forbiddenMarkers: [],
  },
];

const IMPORT_PATTERN = /(?:from\s*|require\(\s*|import\(\s*)["']([^"']+)["']/g;

function collectImports(source) {
  return new Set(
    Array.from(source.matchAll(IMPORT_PATTERN), (match) => match[1]),
  );
}

function hasImport(imports, expected) {
  return Array.from(imports).some(
    (specifier) =>
      specifier === expected || specifier.startsWith(`${expected}/`),
  );
}

async function verifyPackage(rule) {
  const files = ["dist/index.mjs", "dist/index.cjs"];

  for (const relativeFile of files) {
    const filePath = `${rule.dir}/${relativeFile}`;
    const source = await readFile(
      new URL(`../${filePath}`, import.meta.url),
      "utf8",
    );
    const imports = collectImports(source);

    if (source.length > rule.maxBytes) {
      throw new Error(
        `${filePath} 体积异常：${source.length} > ${rule.maxBytes} bytes`,
      );
    }

    for (const marker of [...COMMON_REACT_MARKERS, ...rule.forbiddenMarkers]) {
      if (source.includes(marker)) {
        throw new Error(`${filePath} 内联了禁止运行时：${marker}`);
      }
    }

    for (const expected of rule.requiredImports) {
      if (!hasImport(imports, expected)) {
        throw new Error(`${filePath} 缺少外部引用：${expected}`);
      }
    }
  }
}

await Promise.all(PACKAGE_RULES.map(verifyPackage));
console.log("All package bundle boundaries verified");

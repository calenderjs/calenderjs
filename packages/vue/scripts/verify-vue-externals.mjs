/**
 * 防止 Vue / 兄弟包运行时被打进发布产物。
 *
 * 库只允许留下 import 引用（peer / dependencies），
 * 禁止内联 Vue runtime 或 workspace 源码。
 */
import { readFile } from "node:fs/promises";

const DIST_FILES = ["dist/index.mjs", "dist/index.cjs"];

const FORBIDDEN_MARKERS = [
  // Vue 运行时内部实现特征（而非对外部 vue import 的普通调用）
  "class ReactiveEffect",
  "function createRenderer(",
  "Invalid date: reactive Proxy Date is not supported",
  "class EventRuntime",
  "function formatDateKey",
];

const REQUIRED_EXTERNAL_HINTS = [/from.*["']vue["']|require\(["']vue["']\)/, /@calenderjs\/calendar/];

async function verifyBundle(filePath) {
  const source = await readFile(
    new URL(`../${filePath}`, import.meta.url),
    "utf8",
  );
  const bundledMarker = FORBIDDEN_MARKERS.find((marker) =>
    source.includes(marker),
  );

  if (bundledMarker) {
    throw new Error(`${filePath} 内联了不应打包的运行时：${bundledMarker}`);
  }

  for (const hint of REQUIRED_EXTERNAL_HINTS) {
    if (!hint.test(source)) {
      throw new Error(`${filePath} 缺少外部引用：${hint}`);
    }
  }
}

await Promise.all(DIST_FILES.map(verifyBundle));
console.log("Vue package externals verified");

/**
 * 防止 React / 兄弟包运行时被打进发布产物。
 *
 * 库只允许留下 import 引用（peer / dependencies），
 * 禁止内联 React 18 jsx-runtime（会炸 React 19）或 workspace 源码。
 */
import { readFile } from "node:fs/promises";

const DIST_FILES = ["dist/index.mjs", "dist/index.cjs"];

const FORBIDDEN_MARKERS = [
  "ReactCurrentDispatcher",
  "__SECRET_INTERNALS",
  "reactJsxRuntime_production_min",
  "Invalid date: reactive Proxy Date is not supported",
  "class EventRuntime",
  "function formatDateKey",
];

const REQUIRED_EXTERNAL_HINTS = [/react\/jsx-runtime/, /@calenderjs\/calendar/];

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
console.log("React package externals verified");

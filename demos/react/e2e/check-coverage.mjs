/**
 * RFC-0015 代码覆盖门禁。
 *
 * 分母：demos/react/src 下全部 .ts / .tsx（demo 应用源码）
 * 门槛（由 E01–E13 真实浏览器路径可达覆盖确立，防回归）：
 *   - lines / statements：≥ 94%
 *   - functions / branches：≥ 90%
 * 已知未覆盖（不计入「删减分母」）：
 *   - App 中 validateBase 失败分支（默认事件恒过基础校验）
 *   - MonacoEnvironment.getWorker（V8 常无法归因）
 * 包产物由 monocart 另行报告，不进本门禁。
 *
 * 仅当 E2E_REQUIRE_COMPLETE=1 时强制失败；本地调试可跳过。
 */
import { readFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REQUIRE = process.env.E2E_REQUIRE_COMPLETE === "1";
const DEMO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SUMMARY = resolve(DEMO_ROOT, "monocart-report/coverage/coverage-summary.json");
const OUT_DIR = resolve(DEMO_ROOT, "test-results");
const DEMO_PREFIX = "src/";
const THRESHOLDS = {
  lines: 94,
  statements: 94,
  functions: 90,
  branches: 90,
};

function fail(message) {
  console.error(`RFC-0015 代码覆盖门禁失败: ${message}`);
  if (REQUIRE) process.exit(1);
}

if (!existsSync(SUMMARY)) {
  fail(`缺少报告 ${SUMMARY}`);
  process.exit(REQUIRE ? 1 : 0);
}

const summary = JSON.parse(readFileSync(SUMMARY, "utf8"));
const demoFiles = Object.entries(summary).filter(
  ([key]) => key.startsWith(DEMO_PREFIX) && /\.(tsx?)$/.test(key),
);

if (demoFiles.length === 0) {
  fail("coverage-summary 中无 demos/react/src 下的 ts/tsx 文件");
  process.exit(REQUIRE ? 1 : 0);
}

const totals = Object.fromEntries(
  Object.keys(THRESHOLDS).map((metric) => [metric, { covered: 0, total: 0 }]),
);

for (const [, stats] of demoFiles) {
  for (const metric of Object.keys(THRESHOLDS)) {
    const row = stats[metric];
    if (!row) continue;
    totals[metric].covered += row.covered;
    totals[metric].total += row.total;
  }
}

const report = {
  scope: "demos/react/src .ts/.tsx",
  thresholds: THRESHOLDS,
  files: demoFiles.map(([file]) => file),
  metrics: Object.fromEntries(
    Object.keys(THRESHOLDS).map((metric) => {
      const { covered, total } = totals[metric];
      const pct = total === 0 ? 100 : (covered / total) * 100;
      return [metric, { covered, total, pct }];
    }),
  ),
};

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(
  resolve(OUT_DIR, "code-coverage-gate.json"),
  `${JSON.stringify(report, null, 2)}\n`,
);

let ok = true;
for (const [metric, threshold] of Object.entries(THRESHOLDS)) {
  const { covered, total, pct } = report.metrics[metric];
  console.log(
    `RFC-0015 demo src ${metric}: ${covered}/${total} (${pct.toFixed(2)}%) 门槛 ${threshold}%`,
  );
  if (pct + 1e-9 < threshold) ok = false;
}

if (!ok) {
  fail("demo src 未达代码覆盖门槛");
} else {
  console.log("RFC-0015 demo src 代码覆盖门禁通过");
}

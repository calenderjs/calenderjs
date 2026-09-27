import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type { FullResult, Reporter, Suite } from "@playwright/test/reporter";

// 固定 RFC 分母；不能因 grep、skip 或少跑浏览器而得到完整验收。
const features = Array.from({ length: 13 }, (_, index) => `E${String(index + 1).padStart(2, "0")}`);
const browsers = ["chromium", "firefox", "webkit"];

export default class FeatureReporter implements Reporter {
  private suite?: Suite;

  onBegin(_config: unknown, suite: Suite) {
    this.suite = suite;
  }

  onEnd(result: FullResult) {
    const tests = this.suite!.allTests();
    const rows = browsers.flatMap(browser => features.map(feature => {
      const cases = tests.filter(test =>
        test.parent.project()?.name === browser &&
        test.title.match(/\bE\d{2}\b/g)?.includes(feature),
      );
      return {
        browser,
        feature,
        tests: cases.length,
        passed: cases.length > 0 && cases.every(test =>
          test.expectedStatus === "passed" && test.results.length === 1 &&
          test.results[0].status === "passed",
        ),
      };
    }));
    const covered = rows.filter(row => row.passed).length;
    const report = { covered, total: rows.length, percent: covered / rows.length * 100, rows };
    const output = resolve("test-results/feature-coverage.json");
    mkdirSync(resolve("test-results"), { recursive: true });
    writeFileSync(output, JSON.stringify(report, null, 2) + "\n");
    console.log(`RFC-0015 场景覆盖: ${covered}/${rows.length} (${report.percent.toFixed(2)}%)`);
    // 定向调试仍输出缺口；标准命令强制全矩阵通过。
    if (process.env.E2E_REQUIRE_COMPLETE === "1" && (covered !== rows.length || result.status !== "passed")) {
      return { status: "failed" as const };
    }
  }
}

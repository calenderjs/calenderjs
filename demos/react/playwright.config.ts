import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: true,
  retries: 0,
  workers: 3,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  reporter: [
    ["list"],
    ["html", { open: "never" }],
    ["json", { outputFile: "test-results/results.json" }],
    ["./e2e/feature-reporter.ts"],
    ["monocart-reporter", {
      name: "React Demo E2E",
      outputFile: "monocart-report/index.html",
      coverage: {
        reports: ["v8", "console-summary", "json-summary"],
        // 库按实际消费的 ESM 产物统计；demo 的未执行源码也纳入分母。
        all: { dir: ["./src"], filter: { "**/*.d.ts": false, "**/*.css": false, "**/*": true } },
        sourceFilter: (sourcePath: string) => !sourcePath.includes("node_modules/") && !sourcePath.includes("e2e/harness/"),
      },
    }],
  ],
  use: {
    baseURL: "http://127.0.0.1:4178",
    locale: "zh-CN",
    timezoneId: "America/Los_Angeles",
    viewport: { width: 1440, height: 1000 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
  webServer: {
    command: "pnpm preview --outDir dist-e2e --host 127.0.0.1 --port 4178 --strictPort",
    url: "http://127.0.0.1:4178",
    reuseExistingServer: false,
    timeout: 30_000,
  },
});

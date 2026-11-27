import { defineConfig, devices } from "@playwright/test";

const DEMO_E2E_PORT = 4179;
const DEMO_E2E_ORIGIN = `http://127.0.0.1:${DEMO_E2E_PORT}`;

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
  ],
  use: {
    baseURL: DEMO_E2E_ORIGIN,
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
    command: `pnpm preview --outDir dist-e2e --host 127.0.0.1 --port ${DEMO_E2E_PORT} --strictPort`,
    url: DEMO_E2E_ORIGIN,
    reuseExistingServer: false,
    timeout: 30_000,
  },
});

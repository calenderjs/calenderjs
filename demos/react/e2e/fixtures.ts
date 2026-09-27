import { test as base, expect, type Page } from "@playwright/test";
import { addCoverageReport } from "monocart-reporter";

// 浏览器异常与覆盖数据随每个真实页面用例收集。
export const test = base.extend<{ browserAudit: void }>({
  browserAudit: [async ({ page, browserName }, use, testInfo) => {
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    // demo 必须独立提供编辑器资源，不能依赖外部 CDN。
    await page.route("**/*", route => {
      const url = new URL(route.request().url());
      return url.hostname === "127.0.0.1" ? route.continue() : route.abort();
    });
    if (browserName === "chromium") {
      await page.coverage.startJSCoverage({ resetOnNavigation: false });
    }
    await page.clock.setFixedTime(new Date("2026-09-07T17:00:00Z"));
    await use();
    if (browserName === "chromium") {
      await addCoverageReport(await page.coverage.stopJSCoverage(), testInfo);
    }
    expect(errors, "页面不能出现未处理异常").toEqual([]);
  }, { auto: true }],
});

export { expect };

export const eventSelector = ".month-view-event, .week-view-event, .day-view-event";

export async function openDemo(page: Page) {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "CalenderJS Demo" })).toBeVisible();
  // Monaco 的 inputarea 常为 hidden；以编辑器壳 + 已挂载 textbox 为准。
  await expect(page.locator(".monaco-editor").first()).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Editor content" })).toBeAttached();
  await expect.poll(() =>
    page.evaluate(() => Boolean((globalThis as { monaco?: { editor: { getModels: () => unknown[] } } }).monaco?.editor.getModels().length)),
  ).toBe(true);
  await expect(page.locator(eventSelector)).toHaveCount(2);
}

/** 经真实 Monaco model 写入，触发 onDidChangeModelContent → React onChange。 */
export async function replaceDSL(page: Page, text: string) {
  await page.evaluate((value) => {
    const api = (globalThis as {
      monaco?: { editor: { getModels: () => Array<{ setValue: (v: string) => void }> } };
    }).monaco;
    const model = api?.editor.getModels()[0];
    if (!model) {
      throw new Error("Monaco model 未就绪");
    }
    model.setValue(value);
  }, text);
}

export const validDSL = `type: meeting
name: "团队会议"
description: "标准团队会议类型"

fields:
  - attendees: list of email, required
  - location: string

validate:
  attendees.count between 1 and 50
  startTime.hour >= 9
  startTime.hour <= 18

display:
  color: "#4285f4"
  icon: "meeting"

behavior:
  editable: true
  draggable: true
`;

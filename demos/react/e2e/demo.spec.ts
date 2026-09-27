import { test, expect, openDemo, replaceDSL, validDSL, eventSelector } from "./fixtures";

test("E01 默认 DSL 经真实编辑器与日历显示两条事件", async ({ page }) => {
  await openDemo(page);
  await expect(page.getByText("✓ 团队会议", { exact: true })).toBeVisible();
  await expect(page.getByText("✓ 客户演示", { exact: true })).toBeVisible();
  await expect(page.locator(eventSelector).first()).toHaveCSS("background-color", "rgb(66, 133, 244)");
});

test("E04 有效 DSL 更新日历颜色", async ({ page }) => {
  await openDemo(page);
  await replaceDSL(page, validDSL.replace("#4285f4", "#ff0000"));
  await expect(page.locator(eventSelector)).toHaveCount(2);
  await expect(page.locator(eventSelector).first()).toHaveCSS("background-color", "rgb(255, 0, 0)");
});

test("E05 语法错误清空结果，修复与清空输入均可恢复", async ({ page }) => {
  await openDemo(page);
  await replaceDSL(page, "type: ???");
  await expect(page.getByText(/编译错误:/)).toBeVisible();
  await expect(page.locator(eventSelector)).toHaveCount(0);
  await replaceDSL(page, validDSL);
  await expect(page.locator(eventSelector)).toHaveCount(2);
  await expect(page.getByText(/编译错误:/)).toHaveCount(0);
  await replaceDSL(page, "");
  await expect(page.locator(eventSelector)).toHaveCount(0);
  await replaceDSL(page, validDSL);
  await expect(page.locator(eventSelector)).toHaveCount(2);
});

test("E06 业务规则过滤事件，恢复后重新显示", async ({ page }) => {
  await openDemo(page);
  await replaceDSL(page, validDSL.replace("between 1 and 50", "between 2 and 50"));
  await expect(page.locator(eventSelector)).toHaveCount(1);
  await expect(page.locator(eventSelector)).toContainText("团队会议");
  await expect(page.getByText(/✗ 客户演示/)).toBeVisible();
  await replaceDSL(page, validDSL);
  await expect(page.locator(eventSelector)).toHaveCount(2);
});

test("E07 数据 schema 拒绝事件，修复后恢复", async ({ page }) => {
  await openDemo(page);
  // number 是合法字段类型；attendees 仍为 string[]，触发 data schema 拒绝（非语法错误）。
  await replaceDSL(page, validDSL.replace("list of email", "number"));
  await expect(page.getByText(/✗ 团队会议/)).toBeVisible();
  await expect(page.getByText(/✗ 客户演示/)).toBeVisible();
  await expect(page.locator(eventSelector)).toHaveCount(0);
  await replaceDSL(page, validDSL);
  await expect(page.locator(eventSelector)).toHaveCount(2);
});

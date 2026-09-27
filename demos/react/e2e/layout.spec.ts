import { test, expect, openDemo, eventSelector } from "./fixtures";

test("E09 深浅主题往返保持编辑器与日历一致", async ({ page }) => {
  await openDemo(page);
  // 根节点类名为 .calendar；暗色依赖 App 注入的 --calender-bg-color。
  const calendar = page.locator(".calendar");
  await page.getByRole("button", { name: /暗色模式/ }).click();
  await expect(page.getByRole("button", { name: /浅色模式/ })).toBeVisible();
  await expect(calendar).toHaveCSS("background-color", "rgb(26, 26, 26)");
  // event-dsl-theme-dark 的 base 为 vs-dark，编辑器壳带该类。
  await expect(page.locator(".monaco-editor").first()).toHaveClass(/vs-dark/);
  await page.getByRole("button", { name: /浅色模式/ }).click();
  await expect(calendar).toHaveCSS("background-color", "rgb(255, 255, 255)");
  await expect(page.locator(".monaco-editor").first()).not.toHaveClass(/vs-dark/);
  await expect(page.locator(eventSelector)).toHaveCount(2);
});

test("E10 分栏拖动遵守边界，释放后停止", async ({ page }) => {
  await openDemo(page);
  const container = page.locator(".resizable-splitter");
  const left = container.locator(":scope > div").nth(0);
  const handle = container.locator(":scope > div").nth(1);
  const rect = (await container.boundingBox())!;
  for (const [position, percent] of [[0.6, 60], [0.01, 20], [0.99, 80]]) {
    const bar = (await handle.boundingBox())!;
    await page.mouse.move(bar.x + bar.width / 2, bar.y + 100);
    await page.mouse.down();
    await page.mouse.move(rect.x + rect.width * position, bar.y + 100, { steps: 5 });
    await page.mouse.up();
    await expect.poll(async () => (await left.boundingBox())!.width / rect.width * 100).toBeCloseTo(percent, 0);
    await expect(page.locator("body")).not.toHaveCSS("cursor", "col-resize");
  }
  const width = (await left.boundingBox())!.width;
  await page.mouse.move(rect.x + rect.width / 2, rect.y + 200);
  expect((await left.boundingBox())!.width).toBeCloseTo(width, 0);
});

test("E12 窄屏仍能切换视图与主题", async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 900 });
  await openDemo(page);
  await page.getByRole("button", { name: "日", exact: true }).click();
  await expect(page.locator(".day-view-event")).toHaveCount(2);
  await page.getByRole("button", { name: /暗色模式/ }).click();
  await expect(page.getByRole("button", { name: /浅色模式/ })).toBeVisible();
  await page.locator(".day-view-event").last().scrollIntoViewIfNeeded();
  await expect(page.locator(".day-view-event").last()).toBeVisible();
});

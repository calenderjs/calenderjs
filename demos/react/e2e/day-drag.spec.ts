import { test, expect, openDemo } from "./fixtures";

test("E16 日视图 pointer 拖动连续生效且 resize 实时预览", async ({ page }) => {
  await openDemo(page);
  await page.getByRole("button", { name: "日", exact: true }).click();

  const event = page.locator(".day-view-event", { hasText: "团队会议" });
  await expect(event).toBeVisible();
  await event.scrollIntoViewIfNeeded();

  for (const hour of [11, 12, 13]) {
    const target = page.locator(".day-view-hour-cell").nth(hour);
    const box = (await event.boundingBox())!;
    const targetBox = (await target.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + 2, { steps: 8 });
    await expect(event).toHaveClass(/dragging/);
    await page.mouse.up();
    await expect(page.locator('[data-testid="demo-action-log"]')).toHaveText(
      "已更新事件: 团队会议",
    );
    await expect(event).toContainText(`${String(hour).padStart(2, "0")}:00`);
    await page.mouse.move(1, 1);
    await page.waitForTimeout(100);
  }
});

test("E18 日视图 resize 拖动时高度立即变化", async ({ page }) => {
  await openDemo(page);
  await page.getByRole("button", { name: "日", exact: true }).click();
  const event = page.locator(".day-view-event", { hasText: "团队会议" });
  await expect(event).toBeVisible();
  await event.scrollIntoViewIfNeeded();
  const handleBox = (await event.locator(".day-view-resize-handle").boundingBox())!;
  const beforeHeight = (await event.boundingBox())!.height;
  await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2 + 52, { steps: 5 });
  await expect.poll(async () => (await event.boundingBox())!.height).toBeGreaterThan(beforeHeight);
  await page.mouse.up();
  await expect(page.locator('[data-testid="demo-action-log"]')).toContainText("已更新事件:");
});

test("E20 日视图拖到 DSL validate 范围外仍更新已存在事件", async ({ page }) => {
  await openDemo(page);
  await page.getByRole("button", { name: "日", exact: true }).click();
  const event = page.locator(".day-view-event", { hasText: "团队会议" });
  await expect(event).toBeVisible();
  await event.scrollIntoViewIfNeeded();
  const target = page.locator(".day-view-hour-cell").nth(8);
  const sourceBox = (await event.boundingBox())!;
  const targetBox = (await target.boundingBox())!;
  await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + 2, { steps: 8 });
  await page.mouse.up();
  await expect(page.locator('[data-testid="demo-action-log"]')).toHaveText("已更新事件: 团队会议");
  await expect(event).toContainText("08:00");
});

test("E21 日视图拒绝无编辑权限更新并显示反馈", async ({ page }) => {
  await openDemo(page);
  await page.getByRole("button", { name: "日", exact: true }).click();
  await page.locator("wsx-calendar").evaluate((element) => {
    const calendar = element as HTMLElement & { eventTypeDefinitions: string | null };
    if (typeof calendar.eventTypeDefinitions !== "string") throw new Error("Expected demo DSL text");
    calendar.eventTypeDefinitions = calendar.eventTypeDefinitions.replace("editable: true", "editable: false");
  });
  const event = page.locator(".day-view-event", { hasText: "团队会议" });
  await expect(event).toBeVisible();
  await event.scrollIntoViewIfNeeded();
  const source = (await event.boundingBox())!;
  const target = (await page.locator(".day-view-hour-cell").nth(11).boundingBox())!;
  await page.mouse.move(source.x + source.width / 2, source.y + source.height / 2);
  await page.mouse.down();
  await page.mouse.move(target.x + target.width / 2, target.y + target.height / 2, { steps: 8 });
  await page.mouse.up();
  await expect(event).toHaveClass(/update-rejected/);
  await expect(event).toContainText("10:00");
  await expect(page.locator('[data-testid="demo-action-log"]')).toHaveCount(0);
});

test("E26 日视图键盘移动可越过 DSL validate 范围", async ({ page }) => {
  await openDemo(page);
  await page.getByRole("button", { name: "日", exact: true }).click();
  const event = page.locator(".day-view-event", { hasText: "团队会议" });
  await expect(event).toBeVisible();
  await event.focus();
  await page.keyboard.press("ArrowUp");
  await expect(event).toContainText("09:00");
  await event.focus();
  await page.keyboard.press("ArrowUp");
  await expect(event).toContainText("08:00");
  await expect(page.locator('[data-testid="demo-action-log"]')).toHaveText("已更新事件: 团队会议");
});

test("E27 日视图拖动事件可吸附到 15 分钟", async ({ page }) => {
  await openDemo(page);
  await page.getByRole("button", { name: "日", exact: true }).click();
  const event = page.locator(".day-view-event", { hasText: "团队会议" });
  await expect(event).toBeVisible();
  await event.scrollIntoViewIfNeeded();
  await expect.poll(async () => (await event.boundingBox())?.y).toBeGreaterThan(0);
  const target = page.locator(".day-view-hour-cell").nth(10);
  const sourceBox = (await event.boundingBox())!;
  const targetBox = (await target.boundingBox())!;
  await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + 12, { steps: 5 });
  await expect(event).toHaveClass(/dragging/);
  await page.mouse.up();
  await expect(page.locator('[data-testid="demo-action-log"]')).toHaveText("已更新事件: 团队会议");
  await expect(event).toContainText("10:15");
  await expect(event).toContainText("11:15");
});

test("E28 日视图 resize 可按 15 分钟改变时长并实时预览", async ({ page }) => {
  await openDemo(page);
  await page.getByRole("button", { name: "日", exact: true }).click();
  const event = page.locator(".day-view-event", { hasText: "客户演示" });
  await expect(event).toBeVisible();
  await event.scrollIntoViewIfNeeded();
  await expect.poll(async () => (await event.boundingBox())?.y).toBeGreaterThan(0);
  const handle = event.locator(".day-view-resize-handle");
  const handleBox = (await handle.boundingBox())!;
  const beforeHeight = (await event.boundingBox())!.height;
  await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2 + 12, { steps: 3 });
  await expect(event).toHaveAttribute("style", /calc/);
  await expect.poll(async () => (await event.boundingBox())!.height).toBeGreaterThan(beforeHeight + 8);
  await page.mouse.up();
  await expect(page.locator('[data-testid="demo-action-log"]')).toHaveText("已更新事件: 客户演示");
  await expect(event).toContainText("15:45");
});

import { test, expect, openDemo } from "./fixtures";

test("E17 月视图拖动事件改日期并保留时间长度", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1500 });
  await openDemo(page);
  const sourceCell = page.locator('.month-view-cell[data-date="1788764400000"]');
  const targetCell = page.locator('.month-view-cell[data-date="1788850800000"]');
  const event = sourceCell.locator(".month-view-event", { hasText: "团队会议" });
  await expect(event).toBeVisible();

  const source = (await event.boundingBox())!;
  const target = (await targetCell.boundingBox())!;
  await page.mouse.move(source.x + source.width / 2, source.y + source.height / 2);
  await page.mouse.down();
  await page.mouse.move(target.x + target.width / 2, target.y + target.height / 2, { steps: 8 });
  await page.mouse.up();

  await expect(page.locator('[data-testid="demo-action-log"]')).toHaveText("已更新事件: 团队会议");
  await expect(targetCell.locator(".month-view-event", { hasText: "团队会议" })).toHaveCount(1);
  await expect(sourceCell.locator(".month-view-event", { hasText: "团队会议" })).toHaveCount(0);
  const time = await page.locator("wsx-calendar").evaluate((element) => {
    const event = (element as HTMLElement & { events: Array<{ id: string; startTime: Date; endTime: Date }> }).events.find(item => item.id === "event-1");
    if (!event) throw new Error("Moved event missing from calendar state");
    return [new Date(event.startTime).getHours(), new Date(event.endTime).getHours()];
  });
  expect(time).toEqual([10, 11]);

  const secondTarget = page.locator('.month-view-cell[data-date="1790838000000"]');
  const moved = targetCell.locator(".month-view-event", { hasText: "团队会议" });
  const movedBox = (await moved.boundingBox())!;
  const secondBox = (await secondTarget.boundingBox())!;
  await page.mouse.move(movedBox.x + movedBox.width / 2, movedBox.y + movedBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(secondBox.x + secondBox.width / 2, secondBox.y + secondBox.height / 2, { steps: 8 });
  await page.mouse.up();
  await expect(page.locator('[data-testid="demo-action-log"]')).toHaveText("已更新事件: 团队会议");
  await expect(secondTarget.locator(".month-view-event", { hasText: "团队会议" })).toHaveCount(1);
  await expect(targetCell.locator(".month-view-event", { hasText: "团队会议" })).toHaveCount(0);
  const finalEvent = secondTarget.locator(".month-view-event", { hasText: "团队会议" });
  const selectedDate = await page.locator("wsx-calendar").evaluate((element) => (element as HTMLElement & { date: Date }).date.getDate());
  const editBar = page.locator('[data-testid="demo-edit-bar"]');
  await expect(editBar).toBeHidden();
  await finalEvent.click();
  expect(await page.locator("wsx-calendar").evaluate((element) => (element as HTMLElement & { date: Date }).date.getDate())).toBe(selectedDate);
  await expect(editBar).toBeHidden();
  await finalEvent.dblclick();
  await expect(editBar).toBeVisible();
});

test("E23 月视图拒绝无编辑权限的日期更新并反馈", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1500 });
  await openDemo(page);
  await page.locator("wsx-calendar").evaluate((element) => {
    const calendar = element as HTMLElement & { eventTypeDefinitions: string | null };
    if (typeof calendar.eventTypeDefinitions !== "string") throw new Error("Expected demo DSL text");
    calendar.eventTypeDefinitions = calendar.eventTypeDefinitions.replace("editable: true", "editable: false");
  });
  const dates = await page.locator("wsx-calendar").evaluate((element) => {
    const date = new Date((element as HTMLElement & { date: Date }).date);
    const source = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const target = new Date(source);
    target.setDate(target.getDate() + 1);
    return { source: source.getTime(), target: target.getTime() };
  });
  const sourceCell = page.locator(`.month-view-cell[data-date="${dates.source}"]`);
  const targetCell = page.locator(`.month-view-cell[data-date="${dates.target}"]`);
  const event = sourceCell.locator(".month-view-event", { hasText: "团队会议" });
  const from = (await event.boundingBox())!;
  const to = (await targetCell.boundingBox())!;
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 8 });
  await page.mouse.up();
  await expect(event).toHaveClass(/update-rejected/);
  await expect(sourceCell.locator(".month-view-event", { hasText: "团队会议" })).toHaveCount(1);
  await expect(targetCell.locator(".month-view-event", { hasText: "团队会议" })).toHaveCount(0);
});

test("E24 月视图拖入折叠目标后自动展开并显示事件", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1500 });
  await openDemo(page);
  const dates = await page.locator("wsx-calendar").evaluate((element) => {
    const date = new Date((element as HTMLElement & { date: Date }).date);
    const source = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const target = new Date(source);
    target.setDate(target.getDate() + 1);
    return { source: source.getTime(), target: target.getTime() };
  });
  const sourceCell = page.locator(`.month-view-cell[data-date="${dates.source}"]`);
  const targetCell = page.locator(`.month-view-cell[data-date="${dates.target}"]`);
  await targetCell.click();
  for (let i = 0; i < 3; i++) {
    await page.getByTestId("btn-add-event").click();
  }
  await expect(targetCell.locator(".month-view-event")).toHaveCount(3);
  const event = sourceCell.locator(".month-view-event", { hasText: "客户演示" });
  const from = (await event.boundingBox())!;
  const to = (await targetCell.boundingBox())!;
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 8 });
  await page.mouse.up();
  await expect(targetCell.locator(".month-view-event", { hasText: "客户演示" })).toHaveCount(1);
  await expect(targetCell.locator(".month-view-event")).toHaveCount(4);
  await expect(targetCell.locator(".month-view-more")).toHaveText("收起");
});

test("E25 月视图事件删除按钮仍可点击", async ({ page }) => {
  await openDemo(page);
  await page.locator("wsx-calendar").evaluate((element) => {
    const view = element.shadowRoot?.querySelector("wsx-month-view") as (HTMLElement & {
      onEventDelete: (event: { id: string }) => void;
      events: Array<{ id: string }>;
    }) | null;
    if (!view) throw new Error("MonthView missing");
    view.onEventDelete = (event) => { (window as Window & { __deletedEventId?: string }).__deletedEventId = event.id; };
    view.events = [...view.events];
  });
  const event = page.locator(".month-view-event", { hasText: "团队会议" });
  await expect(event).toBeVisible();
  const deleteButton = event.locator(".month-view-event-delete");
  await event.hover();
  await deleteButton.click();
  await expect.poll(() => page.evaluate(() => (window as Window & { __deletedEventId?: string }).__deletedEventId)).toBe("event-1");
});

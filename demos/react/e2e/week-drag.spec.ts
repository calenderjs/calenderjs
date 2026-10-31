import { test, expect, openDemo } from "./fixtures";

// RFC-0029：周视图每列 hour-cell key 曾跨列重复，导致 7 列里 6 列渲染不出格子，
// 拖拽/点击新建在那 6 天完全失效。本用例对非"幸存列"的真实拖拽与点击新建做回归。
test("E14 周视图跨列真实拖拽与点击新建不受 hour-cell key 冲突影响", async ({ page }) => {
  await openDemo(page);
  await page.getByRole("button", { name: "周", exact: true }).click();

  const columns = page.locator(".week-view-day-column");
  await expect(columns).toHaveCount(7);
  // 修复前：7 列共 24 个 hour-cell（6 列被去重清空）；修复后应为 7 * 24。
  await expect(page.locator(".week-view-hour-cell")).toHaveCount(7 * 24);

  // 固定时钟落在周一（LA 时区），"客户演示" 14:00-15:30 位于周一列。
  const mondayColumn = columns.nth(1);
  const tuesdayColumn = columns.nth(2);
  const demoEvent = mondayColumn.locator(".week-view-event", { hasText: "客户演示" });
  await expect(demoEvent).toBeVisible();
  await demoEvent.scrollIntoViewIfNeeded();
  // dragTo() 用当前 bounding box 定位；WSX shadow DOM 下偶发在布局未稳定时
  // 抓到相邻元素（实测曾错误拖走"团队会议"而非"客户演示"）。显式等一次
  // bounding box 稳定，避免过渡态坐标。
  await expect.poll(async () => (await demoEvent.boundingBox())?.y).toBeGreaterThan(0);

  // 拖到周二 14:00 格——此前因 key 冲突，周二列根本没有可落点的 hour-cell。
  // 原生 HTML5 DnD（draggable + dataTransfer）必须用 locator.dragTo()，
  // page.mouse down/move/up 序列不会触发 dragstart/dragover/drop，纯无效果。
  const tuesdayCells = tuesdayColumn.locator(".week-view-hour-cell");
  await expect(tuesdayCells).toHaveCount(24);
  const targetCell = tuesdayCells.nth(14);
  const box = (await demoEvent.boundingBox())!;
  await demoEvent.dragTo(targetCell, {
    sourcePosition: { x: box.width / 2, y: box.height / 2 },
  });

  await expect(page.locator('[data-testid="demo-action-log"]')).toHaveText("已更新事件: 客户演示");
  await expect(mondayColumn.locator(".week-view-event", { hasText: "客户演示" })).toHaveCount(0);
  await expect(tuesdayColumn.locator(".week-view-event", { hasText: "客户演示" })).toHaveCount(1);

  // 点击周三（同样曾被清空的列）空白时段，验证 handleSlotClick 新建事件可用。
  const wednesdayColumn = columns.nth(3);
  const wednesdayCells = wednesdayColumn.locator(".week-view-hour-cell");
  await expect(wednesdayCells).toHaveCount(24);
  await wednesdayCells.nth(10).click();

  await expect(page.locator('[data-testid="demo-action-log"]')).toHaveText("已在 10:00 创建时段预约");
  await expect(wednesdayColumn.locator(".week-view-event", { hasText: "时段预约" })).toHaveCount(1);
});

// RFC-0032：原生 HTML5 DnD 对真实指针输入不稳定——实测真实鼠标拖拽在 DayView 完全
// 不触发，换成 pointer-event 自建拖拽引擎（startPointerDrag + 跨 shadow DOM 的
// elementFromPointDeep 命中测试）。本用例验证：1）拖拽同时正确改日期和时间（不是
// 只改日期不改时间）；2）连续两次拖拽都生效（不是"拖一次就卡住"）。
test("E15 周视图连续两次真实拖拽都生效，且同时改日期和时间", async ({ page }) => {
  await openDemo(page);
  await page.getByRole("button", { name: "周", exact: true }).click();

  const columns = page.locator(".week-view-day-column");
  const mondayColumn = columns.nth(1);
  const wednesdayColumn = columns.nth(3);
  const meetingEvent = mondayColumn.locator(".week-view-event", { hasText: "团队会议" });
  await expect(meetingEvent).toBeVisible();
  await meetingEvent.scrollIntoViewIfNeeded();
  await expect.poll(async () => (await meetingEvent.boundingBox())?.y).toBeGreaterThan(0);

  // 第一次拖拽：周一 10:00 -> 周三 16:00（跨列改日期，且改到不同小时）
  const wednesdayCells = wednesdayColumn.locator(".week-view-hour-cell");
  const firstTarget = wednesdayCells.nth(16);
  const box1 = (await meetingEvent.boundingBox())!;
  await meetingEvent.dragTo(firstTarget, {
    sourcePosition: { x: box1.width / 2, y: box1.height / 2 },
    targetPosition: { x: 10, y: 2 },
  });

  await expect(page.locator('[data-testid="demo-action-log"]')).toHaveText("已更新事件: 团队会议");
  const movedEvent = wednesdayColumn.locator(".week-view-event", { hasText: "团队会议" });
  await expect(movedEvent).toHaveCount(1);
  await expect(movedEvent).toContainText("16:00");
  await expect(mondayColumn.locator(".week-view-event", { hasText: "团队会议" })).toHaveCount(0);

  // 第二次拖拽：同一个事件再拖一次（周三 16:00 -> 周一 09:00），验证不会"卡住"。
  await movedEvent.scrollIntoViewIfNeeded();
  await expect.poll(async () => (await movedEvent.boundingBox())?.y).toBeGreaterThan(0);
  const mondayCells = mondayColumn.locator(".week-view-hour-cell");
  const secondTarget = mondayCells.nth(9);
  const box2 = (await movedEvent.boundingBox())!;
  await movedEvent.dragTo(secondTarget, {
    sourcePosition: { x: box2.width / 2, y: box2.height / 2 },
    targetPosition: { x: 10, y: 2 },
  });

  await expect(page.locator('[data-testid="demo-action-log"]')).toHaveText("已更新事件: 团队会议");
  const finalEvent = mondayColumn.locator(".week-view-event", { hasText: "团队会议" });
  await expect(finalEvent).toHaveCount(1);
  await expect(finalEvent).toContainText("09:00");
  await expect(wednesdayColumn.locator(".week-view-event", { hasText: "团队会议" })).toHaveCount(0);
});

test("E19 周视图 resize 拖动时高度立即变化且提交新结束时间", async ({ page }) => {
  await openDemo(page);
  await page.getByRole("button", { name: "周", exact: true }).click();
  const event = page.locator(".week-view-event", { hasText: "客户演示" });
  await expect(event).toBeVisible();
  await event.scrollIntoViewIfNeeded();
  const handle = event.locator(".week-view-resize-handle");
  const handleBox = (await handle.boundingBox())!;
  const beforeHeight = (await event.boundingBox())!.height;
  await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2 + 52, { steps: 5 });
  await expect.poll(async () => (await event.boundingBox())!.height).toBeGreaterThan(beforeHeight);
  await page.mouse.up();
  await expect(page.locator('[data-testid="demo-action-log"]')).toHaveText("已更新事件: 客户演示");
  await expect(event).toContainText("16:30");
});

test("E22 周视图拒绝无编辑权限更新并显示反馈", async ({ page }) => {
  await openDemo(page);
  await page.getByRole("button", { name: "周", exact: true }).click();
  await page.locator("wsx-calendar").evaluate((element) => {
    const calendar = element as HTMLElement & { eventTypeDefinitions: string | null };
    if (typeof calendar.eventTypeDefinitions !== "string") throw new Error("Expected demo DSL text");
    calendar.eventTypeDefinitions = calendar.eventTypeDefinitions.replace("editable: true", "editable: false");
    (window as Window & { __weekTrace?: string[] }).__weekTrace = [];
    calendar.shadowRoot?.addEventListener("event-update-request", () => (window as Window & { __weekTrace?: string[] }).__weekTrace?.push("request"), true);
    calendar.addEventListener("event-update-denied", () => (window as Window & { __weekTrace?: string[] }).__weekTrace?.push("denied"));
    calendar.addEventListener("event-update", () => (window as Window & { __weekTrace?: string[] }).__weekTrace?.push("update"));
  });
  const event = page.locator(".week-view-event", { hasText: "团队会议" });
  await expect(event).toBeVisible();
  await event.scrollIntoViewIfNeeded();
  await event.evaluate((element) => {
    (window as Window & { __rejectionFeedbackSeen?: boolean }).__rejectionFeedbackSeen = false;
    new MutationObserver(() => {
      if (element.classList.contains("update-rejected")) {
        (window as Window & { __rejectionFeedbackSeen?: boolean }).__rejectionFeedbackSeen = true;
      }
    }).observe(element, { attributes: true, attributeFilter: ["class"] });
  });
  const source = (await event.boundingBox())!;
  const target = (await page.locator(".week-view-day-column").nth(1).locator(".week-view-hour-cell").nth(12).boundingBox())!;
  await page.mouse.move(source.x + source.width / 2, source.y + source.height / 2);
  await page.mouse.down();
  await page.mouse.move(target.x + target.width / 2, target.y + target.height / 2, { steps: 8 });
  await expect(event).toHaveClass(/dragging/);
  await page.mouse.up();
  await expect.poll(() => page.evaluate(() => (window as Window & { __rejectionFeedbackSeen?: boolean }).__rejectionFeedbackSeen)).toBe(true);
  expect(await page.evaluate(() => (window as Window & { __weekTrace?: string[] }).__weekTrace)).toContain("denied");
  await expect(event).toContainText("10:00");
  await expect(page.locator('[data-testid="demo-action-log"]')).toHaveCount(0);
});

test("E29 周视图拖动事件可吸附到 15 分钟", async ({ page }) => {
  await openDemo(page);
  await page.getByRole("button", { name: "周", exact: true }).click();
  const columns = page.locator(".week-view-day-column");
  const monday = columns.nth(1);
  const event = monday.locator(".week-view-event", { hasText: "团队会议" });
  await expect(event).toBeVisible();
  await event.scrollIntoViewIfNeeded();
  await expect.poll(async () => (await event.boundingBox())?.y).toBeGreaterThan(0);
  const target = monday.locator(".week-view-hour-cell").nth(10);
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

test("E30 周视图 resize 可按 15 分钟改变时长并实时预览", async ({ page }) => {
  await openDemo(page);
  await page.getByRole("button", { name: "周", exact: true }).click();
  const event = page.locator(".week-view-event", { hasText: "客户演示" });
  await expect(event).toBeVisible();
  await event.scrollIntoViewIfNeeded();
  await expect.poll(async () => (await event.boundingBox())?.y).toBeGreaterThan(0);
  const handle = event.locator(".week-view-resize-handle");
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

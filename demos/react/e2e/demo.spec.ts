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

test("E06 业务规则拒绝更新验证状态，但保留已有事件", async ({ page }) => {
  await openDemo(page);
  await replaceDSL(page, validDSL.replace("between 1 and 50", "between 2 and 50"));
  await expect(page.locator(eventSelector)).toHaveCount(2);
  await expect(page.locator(eventSelector).filter({ hasText: "团队会议" })).toHaveCount(1);
  await expect(page.locator(eventSelector).filter({ hasText: "客户演示" })).toHaveCount(1);
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

test("P1 编辑保存经 event-update 与 host props 更新日历", async ({ page }) => {
  await openDemo(page);
  const event = page.locator(".month-view-event", { hasText: "团队会议" });
  await event.dblclick();
  const input = page.getByTestId("input-edit-title");
  await input.fill("RFC 0044 评审");
  await page.getByTestId("btn-save-edit").click();

  await expect(page.getByTestId("demo-action-log")).toContainText("已编辑事件: RFC 0044 评审");
  await expect(page.getByText("✓ RFC 0044 评审", { exact: true })).toBeVisible();
  await expect(input).toBeHidden();
});

test("P0/P2 权限拒绝不改 host 或日历，并保留草稿和错误提示", async ({ page }) => {
  await openDemo(page);
  await replaceDSL(page, validDSL.replace("editable: true", "editable: false"));
  const event = page.locator(".month-view-event", { hasText: "团队会议" });
  await event.dblclick();
  const input = page.getByTestId("input-edit-title");
  await input.fill("不应保存");
  await page.getByTestId("btn-save-edit").click();

  await expect(page.getByTestId("edit-error")).toContainText("没有编辑此事件的权限");
  await expect(input).toHaveValue("不应保存");
  await expect(page.getByText("✓ 团队会议", { exact: true })).toBeVisible();
  await expect(page.getByText("不应保存", { exact: true })).toHaveCount(0);
});

test("P0/P2 DSL 校验拒绝不改 host 或日历，并保留草稿和错误提示", async ({ page }) => {
  await openDemo(page);
  const event = page.locator(".month-view-event", { hasText: "团队会议" });
  await event.dblclick();
  const input = page.getByTestId("input-edit-title");
  await input.fill("非法改名草稿");

  // 当前 Demo 编辑表单只修改标题；通过真实 Calendar API 提交违反 DSL 时间规则的 Event。
  const accepted = await page.locator("wsx-calendar").evaluate((element) => {
    const calendar = element as HTMLElement & {
      getEvents: () => Array<Event & { startTime: Date }>;
      proposeEventUpdate: (event: Event) => boolean;
    };
    const current = calendar.getEvents().find((item) => item.id === "event-1");
    if (!current) throw new Error("找不到待更新事件");
    const startTime = new Date(current.startTime);
    startTime.setHours(5, 0, 0, 0);
    return calendar.proposeEventUpdate({ ...current, startTime });
  });
  expect(accepted).toBe(false);

  await expect(page.getByTestId("edit-error")).toContainText("事件校验失败");
  await expect(input).toHaveValue("非法改名草稿");
  await expect(page.getByText("✓ 团队会议", { exact: true })).toBeVisible();
  await expect(page.getByText("非法改名草稿", { exact: true })).toHaveCount(0);
  await expect(page.getByText("✓ 客户演示", { exact: true })).toBeVisible();
});

test("功能演示：DSL生成事件、重复事件、时段点击、键盘调整、100事件虚拟化与API导出", async ({
  page,
}) => {
  await openDemo(page);
  const actionLog = page.getByTestId("demo-action-log");

  // 1. 通过 EventDataGenerator 生成并添加新事件 (RFC-0011)
  await page.getByTestId("btn-add-event").click();
  await expect(actionLog).toContainText(
    "已通过 EventDataGenerator 创建: DSL生成会议",
  );
  await expect(page.getByText("✓ DSL生成会议", { exact: true })).toBeVisible();

  // 2. 添加重复事件 (RFC-0005)，此时当天共有 4 条事件，出现 "+1 更多"
  await page.getByTestId("btn-add-recurring").click();
  await expect(actionLog).toContainText(
    "已添加连续 5 天重复事件: 每日站会(重复)",
  );
  await expect(page.getByText("✓ 每日站会(重复)", { exact: true })).toBeVisible();

  // 2b. 验证月视图 "+1 更多" 严格位于当天单元格内部且可点击展开/收起
  const todayCell = page.locator(".month-view-cell.today");
  const moreBtn = todayCell.locator(".month-view-more");
  await expect(moreBtn).toBeVisible();
  await expect(moreBtn).toContainText("+1 更多");
  const cellBox = await todayCell.boundingBox();
  const moreBox = await moreBtn.boundingBox();
  expect(cellBox).not.toBeNull();
  expect(moreBox).not.toBeNull();
  expect(moreBox!.y + moreBox!.height).toBeLessThanOrEqual(
    cellBox!.y + cellBox!.height + 1,
  );
  await moreBtn.click();
  await expect(todayCell.locator(".month-view-event")).toHaveCount(4);
  await expect(moreBtn).toContainText("收起");
  await moreBtn.click();
  await expect(todayCell.locator(".month-view-event")).toHaveCount(3);

  // 2c. 单击不打开编辑；双击打开内联编辑栏 (RFC-0039)，修改标题并保存
  const editInput = page.getByTestId("input-edit-title");
  const teamMeeting = todayCell.locator(".month-view-event", { hasText: "团队会议" });
  await teamMeeting.click();
  await expect(editInput).toBeHidden();
  await teamMeeting.dblclick();
  await expect(editInput).toBeVisible();
  await editInput.fill("架构评审会议");
  await page.getByTestId("btn-save-edit").click();
  await expect(actionLog).toContainText("已编辑事件: 架构评审会议");
  await expect(page.getByText("✓ 架构评审会议", { exact: true })).toBeVisible();

  // 3. 切换到日视图，测试点击时间槽创建事件、键盘移动时间、键盘调整时长与拖拽边缘调整时长 (RFC-0020, RFC-0021)
  await page.getByRole("button", { name: "日", exact: true }).click();
  await page.locator(".day-view-hour-cell").nth(13).click();
  await expect(actionLog).toContainText("已在 13:00 创建时段预约");
  await expect(page.getByText("✓ 时段预约", { exact: true })).toBeVisible();

  const firstDayEvent = page.locator(".day-view-event", {
    hasText: "架构评审会议",
  });
  await firstDayEvent.focus();
  await firstDayEvent.press("ArrowDown");
  await expect(actionLog).toContainText("已更新事件: 架构评审会议");
  await firstDayEvent.press("Shift+ArrowDown");
  await expect(actionLog).toContainText("已更新事件: 架构评审会议");

  const resizeHandle = firstDayEvent.locator(".day-view-resize-handle");
  const handleBox = await resizeHandle.boundingBox();
  expect(handleBox).not.toBeNull();
  await page.mouse.move(
    handleBox!.x + handleBox!.width / 2,
    handleBox!.y + handleBox!.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    handleBox!.x + handleBox!.width / 2,
    handleBox!.y + handleBox!.height / 2 + 52,
  );
  await page.mouse.up();
  await expect(actionLog).toContainText("已更新事件:");

  // 4. 从日历 API 导出当前 DSL 与事件状态
  await page.getByTestId("btn-export-dsl").click();
  await expect(actionLog).toContainText("API导出成功:");

  // 5. 100 条密集事件视口虚拟化压测 (RFC-0023)
  await page.getByTestId("btn-stress-100").click();
  await expect(actionLog).toContainText("已加载 100 条密集事件并切换至日视图");
  const renderedDomCount = await page.locator(".day-view-event").count();
  expect(renderedDomCount).toBeGreaterThan(0);
  expect(renderedDomCount).toBeLessThan(100);

  // 6. 重置回默认示例
  await page.getByTestId("btn-reset-demo").click();
  await expect(actionLog).toContainText("已重置为默认示例事件");
  await expect(page.locator(".day-view-event")).toHaveCount(2);
});

test("E32 月视图事件可聚焦，Enter 打开编辑", async ({ page }) => {
  await openDemo(page);
  const editInput = page.getByTestId("input-edit-title");
  const event = page.locator(".month-view-event", { hasText: "团队会议" });
  await event.focus();
  await expect(event).toBeFocused();
  await expect(editInput).toBeHidden();
  await page.keyboard.press("Enter");
  await expect(editInput).toBeVisible();
});

for (const [label, view] of [["月", "month"], ["周", "week"], ["日", "day"]]) {
  test(`E33 ${label}视图双击打开编辑时输入框带出原标题`, async ({ page }) => {
    await openDemo(page);
    await page.getByRole("button", { name: label, exact: true }).click();
    const events = page.locator(`.${view}-view-event`);
    await events.first().dblclick();
    await expect(page.getByTestId("input-edit-title")).toHaveValue("团队会议");
    await events.last().dblclick();
    await expect(page.getByTestId("input-edit-title")).toHaveValue("客户演示");
  });
}


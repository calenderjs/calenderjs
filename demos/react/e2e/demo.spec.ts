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

for (const [label, view] of [["月", "month"], ["周", "week"], ["日", "day"]]) {
  test(`P1 ${label}视图编辑标题、时间和 DSL 数据后同步到日历`, async ({ page }) => {
    await openDemo(page);
    if (label !== "月") await page.getByRole("button", { name: label, exact: true }).click();
    const event = page.locator(`.${view}-view-event`, { hasText: "团队会议" });
    await event.dblclick();
    await expect(page.getByTestId("event-edit-dialog")).toBeVisible();
    await page.getByTestId("input-edit-title").fill(`RFC 0040 ${label}视图`);
    await page.getByTestId("input-edit-start-time").fill("2026-09-07T10:30");
    await page.getByTestId("input-edit-end-time").fill("2026-09-07T11:30");
    await page.getByTestId("event-data-location").fill("新会议室");
    await page.getByTestId("btn-save-edit").click();

    await expect(page.getByTestId("event-edit-dialog")).toHaveCount(0);
    await expect(page.getByText(`✓ RFC 0040 ${label}视图`, { exact: true })).toBeVisible();
    const updated = await page.locator("wsx-calendar").evaluate((element) => {
      const calendar = element as HTMLElement & { getEvents: () => Array<Event & { startTime: Date; endTime: Date }> };
      const item = calendar.getEvents().find((current) => current.id === "event-1");
      if (!item) throw new Error("找不到已更新事件");
      return {
        title: item.title,
        start: new Date(item.startTime).getHours() + ":" + String(new Date(item.startTime).getMinutes()).padStart(2, "0"),
        end: new Date(item.endTime).getHours() + ":" + String(new Date(item.endTime).getMinutes()).padStart(2, "0"),
        location: item.data?.location,
      };
    });
    expect(updated).toEqual({ title: `RFC 0040 ${label}视图`, start: "10:30", end: "11:30", location: "新会议室" });
  });
}

test("P0 校验拒绝保留草稿且不改 host event", async ({ page }) => {
  await openDemo(page);
  const event = page.locator(".month-view-event", { hasText: "团队会议" });
  await event.dblclick();
  const title = page.getByTestId("input-edit-title");
  const start = page.getByTestId("input-edit-start-time");
  await title.fill("非法改名草稿");
  await start.fill("2026-09-07T05:00");
  await page.getByTestId("btn-save-edit").click();

  await expect(page.getByTestId("edit-error")).toContainText("事件校验失败");
  await expect(title).toHaveValue("非法改名草稿");
  await expect(start).toHaveValue("2026-09-07T05:00");
  await expect(page.getByText("✓ 团队会议", { exact: true })).toBeVisible();
  const startHour = await page.locator("wsx-calendar").evaluate((element) => {
    const calendar = element as HTMLElement & { getEvents: () => Array<Event & { startTime: Date }> };
    return new Date(calendar.getEvents().find((item) => item.id === "event-1")!.startTime).getHours();
  });
  expect(startHour).toBe(10);
});

test("P2 editable false 时整个弹窗只读且不提供保存按钮", async ({ page }) => {
  await openDemo(page);
  await replaceDSL(page, validDSL.replace("editable: true", "editable: false"));
  await page.locator(".month-view-event", { hasText: "团队会议" }).dblclick();

  await expect(page.getByTestId("event-edit-dialog")).toBeVisible();
  await expect(page.getByTestId("input-edit-title")).toBeDisabled();
  await expect(page.getByTestId("input-edit-start-time")).toBeDisabled();
  await expect(page.getByTestId("btn-save-edit")).toHaveCount(0);
  await expect(page.getByText("当前事件不可编辑", { exact: true })).toBeVisible();
  await expect(page.getByText("✓ 团队会议", { exact: true })).toBeVisible();
});

test("P2 JSON Schema 数字、布尔、枚举和可选空值正确保存", async ({ page }) => {
  await openDemo(page);
  const typedFieldsDSL = validDSL
    .replace(
      "  - location: string",
      "  - location: string\n  - participantLimit: number, default: 8\n  - remote: boolean, default: true\n  - urgency: enum(low,high), default: low",
    );
  await replaceDSL(page, typedFieldsDSL);
  await page.locator(".month-view-event", { hasText: "团队会议" }).dblclick();

  const limit = page.getByTestId("event-data-participantLimit");
  const remote = page.getByTestId("event-data-remote");
  const urgency = page.getByTestId("event-data-urgency");
  await expect(limit).toHaveAttribute("type", "number");
  await expect(urgency.locator("option")).toHaveCount(3);

  await limit.fill("8");
  await limit.fill("");
  await remote.check();
  await remote.uncheck();
  await urgency.selectOption("high");
  await urgency.selectOption("");
  await page.getByTestId("event-data-location").fill("暂存会议室");
  await page.getByTestId("event-data-location").fill("");
  await page.getByTestId("btn-save-edit").click();

  const data = await page.locator("wsx-calendar").evaluate((element) => {
    const calendar = element as HTMLElement & { getEvents: () => Event[] };
    return calendar.getEvents().find((item) => item.id === "event-1")?.data;
  });
  expect(data).toMatchObject({ remote: false });
  expect(data).not.toHaveProperty("participantLimit");
  expect(data).not.toHaveProperty("urgency");
  expect(data).not.toHaveProperty("location");
});

test("P2 缺少 data 的 host event 仍可打开编辑并显示未设置字段", async ({ page }) => {
  await openDemo(page);
  await page.locator("wsx-calendar").evaluate((element) => {
    const event = {
      id: "event-without-data",
      type: "meeting",
      title: "无附加数据事件",
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
    element.dispatchEvent(
      new CustomEvent("event-edit-request", {
        detail: { event },
        bubbles: true,
      }),
    );
  });

  await expect(page.getByTestId("event-edit-dialog")).toBeVisible();
  await expect(page.getByTestId("input-edit-start-time")).toHaveValue(
    /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/,
  );
  await expect(page.getByTestId("event-data-attendees")).toHaveText("未设置");
  await expect(page.getByTestId("event-data-location")).toHaveValue("");
});

test("P2 DSL 编译失败时 stale host event 可显示无 schema 草稿", async ({ page }) => {
  await openDemo(page);
  await replaceDSL(page, "type: ???");
  await page.locator("wsx-calendar").evaluate((element) => {
    const event = {
      id: "stale-event",
      type: "meeting",
      title: "旧 schema 事件",
      startTime: "invalid",
      endTime: undefined,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
    element.dispatchEvent(
      new CustomEvent("event-edit-request", {
        detail: { event },
        bubbles: true,
      }),
    );
  });

  await expect(page.getByTestId("event-edit-dialog")).toBeVisible();
  await expect(page.getByTestId("input-edit-start-time")).toHaveValue("");
  await expect(page.getByTestId("input-edit-end-time")).toHaveValue("");
  await expect(page.getByTestId("event-data-location")).toHaveCount(0);
});

test("P1 时区不匹配时开始和结束时间只读", async ({ page }) => {
  await openDemo(page);
  await page.locator("wsx-calendar").evaluate((element) => {
    const calendar = element as HTMLElement & { getEvents: () => Event[] };
    const event = calendar.getEvents().find((item) => item.id === "event-1");
    if (!event) throw new Error("找不到测试事件");
    event.timeZone = "Asia/Tokyo";
    element.dispatchEvent(new CustomEvent("event-edit-request", { detail: { event }, bubbles: true }));
  });

  await expect(page.getByTestId("input-edit-start-time")).toBeDisabled();
  await expect(page.getByTestId("input-edit-end-time")).toBeDisabled();
  await expect(page.getByRole("note")).toContainText("时区不同");
});

test("系统主题变化生效，手动切换后保持用户选择", async ({ page }) => {
  await openDemo(page);
  const app = page.locator(".demo-app");
  const initialTheme = await app.getAttribute("data-theme");
  const systemTheme = initialTheme === "dark" ? "light" : "dark";

  await page.emulateMedia({ colorScheme: systemTheme });
  await expect(app).toHaveAttribute("data-theme", systemTheme);

  await page.getByRole("button", { name: /暗色模式|浅色模式/ }).click();
  const manualTheme = systemTheme === "dark" ? "light" : "dark";
  await expect(app).toHaveAttribute("data-theme", manualTheme);

  await page.emulateMedia({
    colorScheme: initialTheme === "dark" ? "dark" : "light",
  });
  await expect(app).toHaveAttribute("data-theme", manualTheme);
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
    await page.getByRole("button", { name: "关闭编辑窗口" }).click();
    await events.last().dblclick();
    await expect(page.getByTestId("input-edit-title")).toHaveValue("客户演示");
  });
}


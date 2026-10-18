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

  // 2c. 点击事件打开内联编辑栏，修改标题并保存
  await todayCell.locator(".month-view-event", { hasText: "团队会议" }).click();
  const editInput = page.getByTestId("input-edit-title");
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


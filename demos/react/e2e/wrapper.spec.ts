import { test, expect } from "./fixtures";

// E13：冷启动固定 props、回调恰一次、属性更新、命令 API、卸载/重挂载。
// dblclick 含两次 click → date +2，另加 double +1（Playwright 合成序列）。
test("E13 React 固定初始属性、回调、属性更新、命令和重挂载契约", async ({
  page,
}) => {
  await page.goto("/e2e/harness/");
  const toolbar = page.locator(".calendar-toolbar-date");
  const calls = page.getByTestId("calls");
  // 冷启动：首帧 props 即生效，不能依赖后续父重渲染补齐。
  await expect(toolbar).toHaveText("2026年8月20日");
  await expect(page.locator(".day-view-event")).toHaveText(/首次挂载事件/);
  await page.locator(".day-view-event").click();
  await expect(calls).toHaveText('{"event":1,"date":0,"view":0,"double":0}');

  await page.getByRole("button", { name: "更新属性", exact: true }).click();
  await expect(toolbar).toHaveText("2026年8月21日");
  await expect(page.locator(".day-view-event")).toHaveText(/属性更新事件/);
  await page.getByRole("button", { name: "月", exact: true }).click();
  await expect(calls).toHaveText('{"event":1,"date":0,"view":1,"double":0}');
  await page.getByRole("button", { name: "下一页", exact: true }).click();
  await expect(toolbar).toHaveText("2026年9月");
  await expect(calls).toHaveText('{"event":1,"date":1,"view":1,"double":0}');
  const cell = page.locator(".month-view-cell:not(.other-month)").first();
  await cell.dblclick();
  await expect(calls).toHaveText('{"event":1,"date":3,"view":1,"double":1}');

  await page.getByRole("button", { name: "命令设置日期", exact: true }).click();
  await expect(toolbar).toHaveText("2026年8月");
  await page.getByRole("button", { name: "命令回今天", exact: true }).click();
  await expect(toolbar).toHaveText("2026年9月");
  await page.getByRole("button", { name: "日", exact: true }).click();
  await expect(toolbar).toHaveText("2026年9月7日");
  // 工具栏「日」已计入 view:2；命令切月不走 React 回调。
  await expect(calls).toHaveText('{"event":1,"date":3,"view":2,"double":1}');
  await page.getByRole("button", { name: "命令切月", exact: true }).click();
  await expect(page.locator("wsx-month-view")).toBeVisible();
  await expect(calls).toHaveText('{"event":1,"date":3,"view":2,"double":1}');

  await page.getByRole("button", { name: "卸载日历", exact: true }).click();
  await expect(page.locator("wsx-calendar")).toHaveCount(0);
  await page.getByRole("button", { name: "挂载日历", exact: true }).click();
  // 重挂载保留 updated props，且不得额外派发 date/view/double。
  await expect(toolbar).toHaveText("2026年8月21日");
  await expect(page.locator(".day-view-event")).toHaveText(/属性更新事件/);
  await expect(calls).toHaveText('{"event":1,"date":3,"view":2,"double":1}');
  await page.locator(".day-view-event").click();
  await expect(calls).toHaveText('{"event":2,"date":3,"view":2,"double":1}');
});

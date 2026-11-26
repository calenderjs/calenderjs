import { test, expect } from "@playwright/test";

const eventSelector = ".month-view-event, .week-view-event, .day-view-event";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "CalenderJS WSX Demo" })).toBeVisible();
  await expect(page.locator(eventSelector)).toHaveCount(2);
});

test("展示 2 条初始事件", async ({ page }) => {
  await expect(page.getByText("团队会议")).toBeVisible();
  await expect(page.getByText("客户演示")).toBeVisible();
});

test("双击事件打开编辑表单并带出原标题", async ({ page }) => {
  await page.getByText("团队会议").dblclick();
  await expect(page.getByTestId("demos-edit-dialog")).toBeVisible();
  await expect(page.getByTestId("demos-edit-input-title")).toHaveValue("团队会议");
});

test("保存成功走 event-update，日历刷新为新标题", async ({ page }) => {
  await page.getByText("团队会议").dblclick();
  const input = page.getByTestId("demos-edit-input-title");
  await input.fill("架构评审会议");
  await page.getByTestId("demos-edit-save").click();
  await expect(page.getByTestId("demos-edit-dialog")).toBeHidden();
  await expect(
    page.locator(".month-view-event-title", { hasText: "架构评审会议" }),
  ).toBeVisible();
});

test("权限拒绝走 event-update-denied，显示提示且不关闭表单", async ({ page }) => {
  await page.getByText("团队会议").dblclick();
  await page.evaluate(() => {
    document
      .getElementById("calendar")!
      .dispatchEvent(new CustomEvent("event-update-denied", { detail: {}, bubbles: true }));
  });
  await expect(page.getByTestId("demos-edit-dialog")).toBeVisible();
  await expect(page.getByTestId("demos-edit-error")).toContainText("没有编辑此事件的权限");
});

test("校验失败走 event-update-error，显示提示且不关闭表单", async ({ page }) => {
  await page.getByText("团队会议").dblclick();
  await page.evaluate(() => {
    document
      .getElementById("calendar")!
      .dispatchEvent(
        new CustomEvent("event-update-error", {
          detail: { errors: ["标题不能为空"] },
          bubbles: true,
        }),
      );
  });
  await expect(page.getByTestId("demos-edit-dialog")).toBeVisible();
  await expect(page.getByTestId("demos-edit-error")).toContainText("标题不能为空");
});

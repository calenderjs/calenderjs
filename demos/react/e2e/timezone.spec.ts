import { test, expect, openDemo } from "./fixtures";

for (const zone of ["UTC", "Asia/Shanghai", "America/Los_Angeles"]) {
  test.describe(zone, () => {
    test.use({ timezoneId: zone });
    for (const date of ["2026-03-08T12:00:00Z", "2026-11-01T12:00:00Z"]) {
      test(`E11 ${zone} ${date} 本地时间与夏令时校验`, async ({ page }) => {
        await page.clock.setFixedTime(new Date(date));
        await openDemo(page);
        await expect(page.getByText("✓ 团队会议", { exact: true })).toBeVisible();
        await expect(page.getByText("✓ 客户演示", { exact: true })).toBeVisible();
        await page.getByRole("button", { name: "日", exact: true }).click();
        await expect(page.locator(".day-view-event-time")).toHaveText(["10:00 - 11:00", "14:00 - 15:30"]);
      });
    }
  });
}

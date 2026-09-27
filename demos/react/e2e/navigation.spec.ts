import { test, expect, openDemo, eventSelector } from "./fixtures";

for (const [label, view] of [["月", "month"], ["周", "week"], ["日", "day"]]) {
  test(`E02 E03 ${label}视图切换、导航与今天`, async ({ page }) => {
    await openDemo(page);
    await page.getByRole("button", { name: label, exact: true }).click();
    const events = page.locator(`.${view}-view-event`);
    await expect(events).toHaveCount(2);
    await expect(events.first()).toContainText("团队会议");
    await expect(events.last()).toContainText("客户演示");
    await expect(events.first()).toHaveCSS("background-color", "rgb(66, 133, 244)");
    if (view !== "month") {
      await expect(events.first()).toContainText("10:00");
      await expect(events.last()).toContainText("14:00");
      const first = await events.first().boundingBox();
      const last = await events.last().boundingBox();
      expect(first?.height).toBeGreaterThan(0);
      expect(last?.y).toBeGreaterThan(first!.y);
    }
    const heading = page.locator(".calendar-toolbar-date");
    const original = await heading.textContent();
    await page.getByRole("button", { name: "下一页", exact: true }).click();
    await expect(heading).not.toHaveText(original!);
    await expect(page.locator(eventSelector)).toHaveCount(0);
    await page.getByRole("button", { name: "上一页", exact: true }).click();
    await expect(heading).toHaveText(original!);
    await expect(events).toHaveCount(2);
    await page.getByRole("button", { name: "上一页", exact: true }).click();
    await expect(heading).not.toHaveText(original!);
    await page.getByRole("button", { name: "今天", exact: true }).click();
    await expect(heading).toHaveText(original!);
    await expect(events).toHaveCount(2);
  });

  test(`E08 ${label}视图点击只回调一次`, async ({ page }) => {
    await openDemo(page);
    await page.getByRole("button", { name: label, exact: true }).click();
    const callbacks: string[] = [];
    page.on("console", message => {
      if (message.text().startsWith("Event clicked:")) callbacks.push(message.text());
    });
    await page.locator(`.${view}-view-event`).first().click();
    await expect.poll(() => callbacks.length).toBe(1);
    expect(callbacks[0]).toContain("event-1");
  });
}

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Calendar from "../Calendar.wsx";
import "../Calendar.wsx";

// 等待父组件及子视图完成异步渲染。
async function waitForRender() {
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

describe("日历子视图事件转发", () => {
  let calendar: Calendar;

  beforeEach(async () => {
    calendar = document.createElement("wsx-calendar") as Calendar;
    calendar.setAttribute("date", "2026-09-07T10:00:00");
    calendar.events = [
      {
        id: "meeting-1",
        type: "meeting",
        title: "事件转发测试",
        startTime: new Date("2026-09-07T10:00:00"),
        endTime: new Date("2026-09-07T11:00:00"),
      },
    ];
    document.body.appendChild(calendar);
    await waitForRender();
  });

  afterEach(() => calendar.remove());

  it.each(["month", "week", "day"])(
    "%s 视图点击只派发一次公开事件",
    async (view) => {
      calendar.setAttribute("view", view);
      await waitForRender();
      const listener = vi.fn();
      calendar.addEventListener("event-click", listener);
      const child = calendar.shadowRoot!.querySelector(`wsx-${view}-view`)!;
      const event = child.shadowRoot!.querySelector<HTMLElement>(
        `.${view}-view-event`,
      );
      expect(event).not.toBeNull();
      event!.click();
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener.mock.calls[0][0].detail.event.id).toBe("meeting-1");
      expect(listener.mock.calls[0][0].target).toBe(calendar);
    },
  );

  it("日期双击只派发一次公开事件", () => {
    const listener = vi.fn();
    calendar.addEventListener("date-double-click", listener);
    const child = calendar.shadowRoot!.querySelector("wsx-month-view")!;
    const cell = child.shadowRoot!.querySelector<HTMLElement>(
      ".month-view-cell:not(.other-month)",
    )!;
    cell.dispatchEvent(
      new MouseEvent("dblclick", { bubbles: true, composed: true }),
    );
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0].detail.date.getDate()).toBe(1);
    expect(listener.mock.calls[0][0].target).toBe(calendar);
  });

  it("日期点击更新公开日期且只派发一次", () => {
    const listener = vi.fn();
    calendar.addEventListener("date-change", listener);
    const child = calendar.shadowRoot!.querySelector("wsx-month-view")!;
    const cell = child.shadowRoot!.querySelector<HTMLElement>(
      ".month-view-cell:not(.other-month)",
    )!;
    cell.click();
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0].detail.date.getDate()).toBe(1);
  });

  it("断连时清理监听器，重新连接后恢复且不重复", async () => {
    const listener = vi.fn();
    calendar.addEventListener("event-click", listener);
    const child = calendar.shadowRoot!.querySelector("wsx-month-view")!;
    const event =
      child.shadowRoot!.querySelector<HTMLElement>(".month-view-event")!;
    calendar.remove();
    event.click();
    expect(listener).not.toHaveBeenCalled();
    document.body.appendChild(calendar);
    await waitForRender();
    calendar
      .shadowRoot!.querySelector("wsx-month-view")!
      .shadowRoot!.querySelector<HTMLElement>(".month-view-event")!
      .click();
    expect(listener).toHaveBeenCalledTimes(1);
  });
});

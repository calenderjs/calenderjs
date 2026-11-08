import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Calendar from "../Calendar.wsx";
import "../Calendar.wsx";

async function waitForRender() {
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

const VIEWS = ["month", "week", "day"] as const;

describe("RFC-0039 event-edit-request", () => {
  let calendar: Calendar;

  beforeEach(async () => {
    calendar = document.createElement("wsx-calendar") as Calendar;
    calendar.setAttribute("date", "2026-09-07T10:00:00");
    calendar.events = [
      {
        id: "meeting-1",
        type: "meeting",
        title: "编辑触发测试",
        startTime: new Date("2026-09-07T10:00:00"),
        endTime: new Date("2026-09-07T11:00:00"),
      },
    ];
    document.body.appendChild(calendar);
    await waitForRender();
  });

  afterEach(() => calendar.remove());

  async function eventElement(view: (typeof VIEWS)[number]) {
    calendar.setAttribute("view", view);
    await waitForRender();
    const child = calendar.shadowRoot!.querySelector(`wsx-${view}-view`)!;
    const element = child.shadowRoot!.querySelector<HTMLElement>(
      `.${view}-view-event`,
    );
    expect(element).not.toBeNull();
    return element!;
  }

  function listen() {
    const editRequest = vi.fn();
    const click = vi.fn();
    const dateDoubleClick = vi.fn();
    calendar.addEventListener("event-edit-request", editRequest);
    calendar.addEventListener("event-click", click);
    calendar.addEventListener("date-double-click", dateDoubleClick);
    return { editRequest, click, dateDoubleClick };
  }

  it.each(VIEWS)("%s 视图双击派发一次 event-edit-request", async (view) => {
    const element = await eventElement(view);
    const { editRequest } = listen();
    element.dispatchEvent(
      new MouseEvent("dblclick", { bubbles: true, composed: true }),
    );
    expect(editRequest).toHaveBeenCalledTimes(1);
    const fired = editRequest.mock.calls[0][0] as CustomEvent;
    expect(fired.detail.event.id).toBe("meeting-1");
    expect(fired.target).toBe(calendar);
    expect(Object.getPrototypeOf(fired.detail.event)).toBe(Object.prototype);
  });

  it.each(VIEWS)("%s 视图单击只派发 event-click", async (view) => {
    const element = await eventElement(view);
    const { editRequest, click } = listen();
    element.click();
    expect(click).toHaveBeenCalledTimes(1);
    expect(editRequest).not.toHaveBeenCalled();
  });

  it.each(VIEWS)("%s 视图 Enter/Space 派发 event-edit-request", async (view) => {
    for (const key of ["Enter", " "]) {
      const element = await eventElement(view);
      const { editRequest, click } = listen();
      element.dispatchEvent(
        new KeyboardEvent("keydown", { key, bubbles: true, composed: true }),
      );
      expect(editRequest).toHaveBeenCalledTimes(1);
      expect(click).not.toHaveBeenCalled();
      calendar.removeEventListener("event-edit-request", editRequest);
      calendar.removeEventListener("event-click", click);
    }
  });

  it("月视图事件可 Tab 聚焦", async () => {
    const element = await eventElement("month");
    expect(element.tabIndex).toBe(0);
  });

  async function monthEventWithDeleteButton() {
    calendar.setAttribute("view", "month");
    await waitForRender();
    const view = calendar.shadowRoot!.querySelector("wsx-month-view") as HTMLElement & {
      onEventDelete: () => void;
      events: unknown[];
    };
    view.onEventDelete = () => {};
    view.events = [...view.events];
    await waitForRender();
    const button = view.shadowRoot!.querySelector<HTMLElement>(
      ".month-view-event-delete",
    );
    expect(button).not.toBeNull();
    return button!;
  }

  it("月视图双击删除按钮不请求编辑", async () => {
    const button = await monthEventWithDeleteButton();
    const { editRequest, dateDoubleClick } = listen();
    button.dispatchEvent(
      new MouseEvent("dblclick", { bubbles: true, composed: true }),
    );
    expect(editRequest).not.toHaveBeenCalled();
    expect(dateDoubleClick).not.toHaveBeenCalled();
  });

  it("月视图焦点在删除按钮时按 Enter 不请求编辑", async () => {
    const button = await monthEventWithDeleteButton();
    const { editRequest } = listen();
    button.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", bubbles: true, composed: true }),
    );
    expect(editRequest).not.toHaveBeenCalled();
  });

  it.each(VIEWS)("%s 视图按其他键不请求编辑", async (view) => {
    const element = await eventElement(view);
    const { editRequest } = listen();
    element.dispatchEvent(
      new KeyboardEvent("keydown", { key: "a", bubbles: true, composed: true }),
    );
    expect(editRequest).not.toHaveBeenCalled();
  });

  it("断连后停止转发，重新连接后恢复且不重复", async () => {
    const element = await eventElement("month");
    const { editRequest } = listen();
    calendar.remove();
    element.dispatchEvent(
      new MouseEvent("dblclick", { bubbles: true, composed: true }),
    );
    expect(editRequest).not.toHaveBeenCalled();
    document.body.appendChild(calendar);
    await waitForRender();
    calendar
      .shadowRoot!.querySelector("wsx-month-view")!
      .shadowRoot!.querySelector<HTMLElement>(".month-view-event")!
      .dispatchEvent(
        new MouseEvent("dblclick", { bubbles: true, composed: true }),
      );
    expect(editRequest).toHaveBeenCalledTimes(1);
  });

  it("月视图双击事件不触发 date-double-click", async () => {
    const element = await eventElement("month");
    const { dateDoubleClick } = listen();
    element.dispatchEvent(
      new MouseEvent("dblclick", { bubbles: true, composed: true }),
    );
    expect(dateDoubleClick).not.toHaveBeenCalled();
  });
});

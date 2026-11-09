import { describe, it, expect, vi, afterEach } from "vitest";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react";
import { createElement, createRef } from "react";
import { Calendar, type CalendarRef } from "../Calendar";
import type { Event } from "@calenderjs/event-model";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement | null = null;
let root: Root | null = null;

function mount(props: Parameters<typeof Calendar>[0] = {}) {
  container = document.createElement("div");
  document.body.appendChild(container);
  const ref = createRef<CalendarRef>();
  root = createRoot(container);
  act(() => {
    root!.render(createElement(Calendar, { ...props, ref } as any));
  });
  return ref;
}

afterEach(() => {
  if (root && container) {
    act(() => {
      root!.unmount();
    });
  }
  container?.remove();
  container = null;
  root = null;
});

describe("RFC-0039 Calendar onEventEditRequest 转发", () => {
  it("底层 wsx-calendar 派发 event-edit-request 时调用 onEventEditRequest", () => {
    const onEventEditRequest = vi.fn();
    const ref = mount({ onEventEditRequest });

    const element = ref.current?.getElement();
    expect(element).toBeTruthy();

    const fakeEvent: Event = {
      id: "e1",
      title: "测试事件",
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      type: "default",
    } as Event;

    act(() => {
      element!.dispatchEvent(
        new CustomEvent("event-edit-request", {
          detail: { event: fakeEvent },
          bubbles: true,
        }),
      );
    });

    expect(onEventEditRequest).toHaveBeenCalledTimes(1);
    expect(onEventEditRequest.mock.calls[0][0].detail.event).toEqual(
      fakeEvent,
    );
  });

  it("未传 onEventEditRequest 时派发事件不报错", () => {
    const ref = mount({});
    const element = ref.current?.getElement();

    expect(() => {
      act(() => {
        element!.dispatchEvent(
          new CustomEvent("event-edit-request", {
            detail: { event: {} },
            bubbles: true,
          }),
        );
      });
    }).not.toThrow();
  });

  it("组件卸载后不再调用 onEventEditRequest（listener 已清理）", () => {
    const onEventEditRequest = vi.fn();
    const ref = mount({ onEventEditRequest });
    const element = ref.current?.getElement();

    act(() => {
      root!.unmount();
    });

    expect(() => {
      element!.dispatchEvent(
        new CustomEvent("event-edit-request", {
          detail: { event: {} },
          bubbles: true,
        }),
      );
    }).not.toThrow();
    expect(onEventEditRequest).not.toHaveBeenCalled();
  });
});

describe("RFC-0044 Calendar 更新提议转发", () => {
  const fakeEvent: Event = {
    id: "e44",
    title: "提议事件",
    startTime: new Date("2026-09-07T10:00:00Z"),
    endTime: new Date("2026-09-07T11:00:00Z"),
    type: "meeting",
  } as Event;

  it("ref 将更新提议转发到底层 Calendar 并返回结果", () => {
    const ref = mount();
    const element = ref.current!.getElement() as HTMLElement & {
      proposeEventUpdate: (event: Event) => boolean;
    };
    const proposeEventUpdate = vi.fn(() => true);
    element.proposeEventUpdate = proposeEventUpdate;

    expect(ref.current!.proposeEventUpdate(fakeEvent)).toBe(true);
    expect(proposeEventUpdate).toHaveBeenCalledWith(fakeEvent);
  });

  it("ref 命令转发视图、日期、事件、DSL 和创建操作", () => {
    const ref = mount();
    const element = ref.current!.getElement() as HTMLElement & {
      view?: string;
      date?: Date;
      getEvents?: () => Event[];
      getEventDSL?: () => string;
      addEvent?: (event: Event) => boolean;
    };
    const addEvent = vi.fn(() => true);
    element.getEvents = vi.fn(() => [fakeEvent]);
    element.getEventDSL = vi.fn(() => "type: meeting");
    element.addEvent = addEvent;

    ref.current!.setView("week");
    expect(element.view).toBe("week");
    ref.current!.setDate("2026-09-07T10:00:00Z");
    expect(element.date).toEqual(new Date("2026-09-07T10:00:00Z"));
    ref.current!.goToToday();
    expect(element.date).toBeInstanceOf(Date);
    expect(ref.current!.getEvents()).toEqual([fakeEvent]);
    expect(ref.current!.getEventDSL()).toBe("type: meeting");
    expect(ref.current!.addEvent(fakeEvent)).toBe(true);
    expect(addEvent).toHaveBeenCalledWith(fakeEvent);

    element.addEvent = undefined;
    (element as any).proposeEventUpdate = undefined;
    expect(ref.current!.addEvent(fakeEvent)).toBe(false);
    expect(ref.current!.proposeEventUpdate(fakeEvent)).toBe(false);
  });

  it("转发成功、权限拒绝和校验错误事件", () => {
    const onEventUpdate = vi.fn();
    const onEventUpdateDenied = vi.fn();
    const onEventUpdateError = vi.fn();
    const ref = mount({ onEventUpdate, onEventUpdateDenied, onEventUpdateError });
    const element = ref.current!.getElement()!;
    const denied = new CustomEvent("event-update-denied", {
      detail: { event: fakeEvent },
    });
    const invalid = new CustomEvent("event-update-error", {
      detail: { event: fakeEvent, errors: ["title invalid"] },
    });

    act(() => {
      element.dispatchEvent(
        new CustomEvent("event-update", { detail: { event: fakeEvent } }),
      );
      element.dispatchEvent(denied);
      element.dispatchEvent(invalid);
    });

    expect(onEventUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ detail: { event: fakeEvent } }),
    );
    expect(onEventUpdateDenied).toHaveBeenCalledWith(denied);
    expect(onEventUpdateError).toHaveBeenCalledWith(invalid);
  });

  it("卸载时清理拒绝与校验错误监听器", () => {
    const onEventUpdateDenied = vi.fn();
    const onEventUpdateError = vi.fn();
    const ref = mount({ onEventUpdateDenied, onEventUpdateError });
    const element = ref.current!.getElement()!;

    act(() => root!.unmount());
    element.dispatchEvent(
      new CustomEvent("event-update-denied", { detail: { event: fakeEvent } }),
    );
    element.dispatchEvent(
      new CustomEvent("event-update-error", {
        detail: { event: fakeEvent, errors: [] },
      }),
    );

    expect(onEventUpdateDenied).not.toHaveBeenCalled();
    expect(onEventUpdateError).not.toHaveBeenCalled();
  });
});

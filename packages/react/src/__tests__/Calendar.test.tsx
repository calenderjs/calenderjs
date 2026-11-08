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

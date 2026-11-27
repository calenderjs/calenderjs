import { describe, it, expect, vi, afterEach } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import Calendar from "../Calendar.vue";
import type { Event } from "@calenderjs/event-model";

let wrapper: VueWrapper | null = null;

function render(props: Record<string, unknown> = {}) {
  wrapper = mount(Calendar, { props, attachTo: document.body });
  return wrapper;
}

function getElement(w: VueWrapper): HTMLElement {
  return w.element as HTMLElement;
}

afterEach(() => {
  wrapper?.unmount();
  wrapper = null;
});

const fakeEvent: Event = {
  id: "e1",
  title: "测试事件",
  startTime: new Date("2026-09-07T10:00:00Z"),
  endTime: new Date("2026-09-07T11:00:00Z"),
  type: "meeting",
} as Event;

describe("Calendar.vue 事件转发", () => {
  it("底层 wsx-calendar 派发 event-edit-request 时 emit event-edit-request", () => {
    const w = render();
    const element = getElement(w);

    element.dispatchEvent(
      new CustomEvent("event-edit-request", {
        detail: { event: fakeEvent },
        bubbles: true,
      }),
    );

    const emitted = w.emitted("event-edit-request");
    expect(emitted).toHaveLength(1);
    expect((emitted![0][0] as CustomEvent).detail.event).toEqual(fakeEvent);
  });

  it("卸载后不再 emit（listener 已清理）", () => {
    const w = render();
    const element = getElement(w);
    w.unmount();
    wrapper = null;

    expect(() => {
      element.dispatchEvent(
        new CustomEvent("event-edit-request", {
          detail: { event: fakeEvent },
          bubbles: true,
        }),
      );
    }).not.toThrow();
  });

  it("转发成功、权限拒绝和校验错误事件", () => {
    const w = render();
    const element = getElement(w);

    element.dispatchEvent(
      new CustomEvent("event-update", { detail: { event: fakeEvent } }),
    );
    element.dispatchEvent(
      new CustomEvent("event-update-denied", { detail: { event: fakeEvent } }),
    );
    element.dispatchEvent(
      new CustomEvent("event-update-error", {
        detail: { event: fakeEvent, errors: ["title invalid"] },
      }),
    );

    expect(w.emitted("event-update")).toHaveLength(1);
    expect(w.emitted("event-update-denied")).toHaveLength(1);
    expect(w.emitted("event-update-error")).toHaveLength(1);
  });
});

describe("Calendar.vue props → property 同步", () => {
  it("view/date/events/user 变化后写入底层元素 property", async () => {
    const w = render({ view: "month", events: [fakeEvent] });
    const element = getElement(w) as HTMLElement & {
      view?: string;
      events?: Event[];
    };

    expect(element.view).toBe("month");
    expect(element.events).toEqual([fakeEvent]);

    await w.setProps({ view: "week" });
    expect(element.view).toBe("week");
  });
});

describe("Calendar.vue expose()", () => {
  it("setView/setDate/goToToday 写入底层元素", () => {
    const w = render();
    const element = getElement(w) as HTMLElement & { view?: string; date?: Date };
    const exposed = w.vm as unknown as {
      setView: (v: "month" | "week" | "day") => void;
      setDate: (d: Date | string) => void;
      goToToday: () => void;
    };

    exposed.setView("week");
    expect(element.view).toBe("week");

    exposed.setDate("2026-09-07T10:00:00Z");
    expect(element.date).toEqual(new Date("2026-09-07T10:00:00Z"));

    exposed.goToToday();
    expect(element.date).toBeInstanceOf(Date);
  });

  it("getEvents/getEventDSL/addEvent 转发到底层元素方法", () => {
    const w = render();
    const element = getElement(w) as HTMLElement & {
      getEvents?: () => Event[];
      getEventDSL?: () => string;
      addEvent?: (e: Event) => boolean;
    };
    element.getEvents = vi.fn(() => [fakeEvent]);
    element.getEventDSL = vi.fn(() => "type: meeting");
    element.addEvent = vi.fn(() => true);

    const exposed = w.vm as unknown as {
      getEvents: () => Event[];
      getEventDSL: () => string | null;
      addEvent: (e: Event) => boolean;
    };

    expect(exposed.getEvents()).toEqual([fakeEvent]);
    expect(exposed.getEventDSL()).toBe("type: meeting");
    expect(exposed.addEvent(fakeEvent)).toBe(true);
    expect(element.addEvent).toHaveBeenCalledWith(fakeEvent);
  });

  it("addEvent/proposeEventUpdate 在底层方法缺失时安全返回 false", () => {
    const w = render();
    const exposed = w.vm as unknown as {
      addEvent: (e: Event) => boolean;
      proposeEventUpdate: (e: Event) => boolean;
      canPerformAction: (action: string, e: Event) => boolean;
    };

    expect(exposed.addEvent(fakeEvent)).toBe(false);
    expect(exposed.proposeEventUpdate(fakeEvent)).toBe(false);
    expect(exposed.canPerformAction("editable", fakeEvent)).toBe(false);
  });

  it("proposeEventUpdate/canPerformAction 转发到底层元素方法", () => {
    const w = render();
    const element = getElement(w) as HTMLElement & {
      proposeEventUpdate?: (e: Event) => boolean;
      canPerformAction?: (action: string, e: Event) => boolean;
    };
    element.proposeEventUpdate = vi.fn(() => true);
    element.canPerformAction = vi.fn(() => true);

    const exposed = w.vm as unknown as {
      proposeEventUpdate: (e: Event) => boolean;
      canPerformAction: (action: string, e: Event) => boolean;
    };

    expect(exposed.proposeEventUpdate(fakeEvent)).toBe(true);
    expect(element.proposeEventUpdate).toHaveBeenCalledWith(fakeEvent);
    expect(exposed.canPerformAction("editable", fakeEvent)).toBe(true);
    expect(element.canPerformAction).toHaveBeenCalledWith("editable", fakeEvent);
  });

  it("getElement 返回底层 DOM 元素", () => {
    const w = render();
    const exposed = w.vm as unknown as { getElement: () => HTMLElement | null };
    expect(exposed.getElement()).toBe(getElement(w));
  });
});

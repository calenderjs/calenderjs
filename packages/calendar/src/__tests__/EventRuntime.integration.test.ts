/**
 * Calendar EventRuntime 集成测试
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { EventDSLCompiler } from "@calenderjs/event-dsl";
import type { EventTypeAST } from "@calenderjs/event-dsl";
import { EventRuntime } from "@calenderjs/event-runtime";
import type { Event } from "@calenderjs/event-model";
import "../Calendar.wsx";
import Calendar from "../Calendar.wsx";

const MEETING_AST: EventTypeAST = {
  type: "meeting",
  name: "会议",
  fields: [
    {
      name: "attendees",
      type: { type: "list", itemType: "email" },
      required: true,
    },
  ],
  display: [
    {
      name: "color",
      value: "#4285f4",
    },
    {
      name: "icon",
      value: "meeting",
    },
  ],
  behavior: [{ name: "editable", value: true }],
};

function createMeetingEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: "event-1",
    type: "meeting",
    title: "团队会议",
    startTime: new Date("2024-01-15T10:00:00"),
    endTime: new Date("2024-01-15T11:00:00"),
    data: {
      attendees: ["a@example.com", "b@example.com"],
    },
    ...overrides,
  };
}

describe("Calendar EventRuntime 集成", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it("设置 eventRuntime 后应增强 displayEvents 标题", async () => {
    const compiler = new EventDSLCompiler();
    const dataModel = compiler.compileFromAST([MEETING_AST]);
    const runtime = new EventRuntime(dataModel.types[0]);

    const calendar = document.createElement("wsx-calendar") as Calendar;
    calendar.eventRuntime = runtime;
    calendar.events = [createMeetingEvent()];
    container.appendChild(calendar);

    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(calendar.displayEvents[0].title).toBe("团队会议");
    expect(calendar.displayEvents[0].color).toBe("#4285f4");
    expect(calendar.displayEvents[0].icon).toBe("meeting");
  });

  it("title display 规则应改写 displayEvents 标题", async () => {
    const ast: EventTypeAST = {
      ...MEETING_AST,
      display: [{ name: "title", value: "[会] 团队会议" }],
    } as EventTypeAST;
    const runtime = new EventRuntime(
      new EventDSLCompiler().compileFromAST([ast]).types[0],
    );
    const calendar = document.createElement("wsx-calendar") as Calendar;
    calendar.eventRuntime = runtime;
    calendar.events = [createMeetingEvent()];
    container.appendChild(calendar);
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(calendar.displayEvents[0].title).toBe("[会] 团队会议");
  });

  it("description display 规则应出现在 displayEvents 上", async () => {
    const ast: EventTypeAST = {
      ...MEETING_AST,
      display: [{ name: "description", value: "周会说明" }],
    } as EventTypeAST;
    const runtime = new EventRuntime(
      new EventDSLCompiler().compileFromAST([ast]).types[0],
    );
    const calendar = document.createElement("wsx-calendar") as Calendar;
    calendar.eventRuntime = runtime;
    calendar.events = [createMeetingEvent()];
    container.appendChild(calendar);
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(calendar.displayEvents[0].data?.description).toBe("周会说明");
    expect(calendar.displayEvents[0].data?.attendees).toHaveLength(2);
  });

  it("无 Runtime 时 displayEvents 应等于原始 events", () => {
    const calendar = document.createElement("wsx-calendar") as Calendar;
    const events = [createMeetingEvent()];
    calendar.events = events;

    expect(calendar.displayEvents[0].id).toBe(events[0].id);
    expect(calendar.displayEvents[0].title).toBe(events[0].title);
  });

  it("proposeEventCreate 验证失败时应派发 event-create-error", () => {
    const compiler = new EventDSLCompiler();
    const astWithRule: EventTypeAST = {
      ...MEETING_AST,
      validate: [
        {
          type: "Between",
          field: {
            type: "FieldAccess",
            path: ["data", "attendees", "count"],
          },
          min: 3,
          max: 50,
        },
      ],
    };
    const runtime = new EventRuntime(
      compiler.compileFromAST([astWithRule]).types[0],
    );

    const calendar = document.createElement("wsx-calendar") as Calendar;
    calendar.eventRuntime = runtime;
    container.appendChild(calendar);

    const errorHandler = vi.fn();
    calendar.addEventListener("event-create-error", errorHandler);

    const ok = calendar.proposeEventCreate(createMeetingEvent());

    expect(ok).toBe(false);
    expect(errorHandler).toHaveBeenCalled();
  });

  it("canPerformAction 应委托给 EventRuntime", () => {
    const compiler = new EventDSLCompiler();
    const runtime = new EventRuntime(
      compiler.compileFromAST([MEETING_AST]).types[0],
    );

    const calendar = document.createElement("wsx-calendar") as Calendar;
    calendar.eventRuntime = runtime;
    calendar.user = {
      id: "1",
      email: "user@example.com",
      role: "user",
    };

    expect(calendar.canPerformAction("editable", createMeetingEvent())).toBe(
      true,
    );
  });

  describe("canPerform 门控", () => {
    const AST_NO_PERMS: EventTypeAST = {
      ...MEETING_AST,
      behavior: [
        { name: "editable", value: false },
        { name: "deletable", value: false },
      ],
    };
    const AST_PERMS: EventTypeAST = {
      ...MEETING_AST,
      behavior: [
        { name: "editable", value: true },
        { name: "deletable", value: true },
      ],
    };

    function setup(ast: EventTypeAST | null) {
      const calendar = document.createElement("wsx-calendar") as Calendar;
      calendar.setAttribute("date", "2024-01-15T10:00:00");
      calendar.events = [createMeetingEvent()];
      if (ast) {
        calendar.eventRuntime = new EventRuntime(
          new EventDSLCompiler().compileFromAST([ast]).types[0],
        );
        calendar.user = { id: "1", email: "u@example.com", role: "user" };
      }
      container.appendChild(calendar);
      return calendar;
    }

    // 子视图 event-delete 不 composed，只在 ShadowRoot 汇合
    function childDelete(calendar: Calendar) {
      calendar.shadowRoot!.dispatchEvent(
        new CustomEvent("event-delete", {
          detail: { event: createMeetingEvent() },
        }),
      );
    }

    it("删除被拒绝：不派发 event-delete，派发 event-delete-denied", () => {
      const calendar = setup(AST_NO_PERMS);
      const ok = vi.fn();
      const denied = vi.fn();
      calendar.addEventListener("event-delete", ok);
      calendar.addEventListener("event-delete-denied", denied);
      childDelete(calendar);
      expect(ok).not.toHaveBeenCalled();
      expect(denied).toHaveBeenCalledTimes(1);
    });

    it("删除被允许：派发 event-delete", () => {
      const calendar = setup(AST_PERMS);
      const ok = vi.fn();
      calendar.addEventListener("event-delete", ok);
      childDelete(calendar);
      expect(ok).toHaveBeenCalledTimes(1);
    });

    it("无 Runtime：删除照常放行", () => {
      const calendar = setup(null);
      const ok = vi.fn();
      calendar.addEventListener("event-delete", ok);
      childDelete(calendar);
      expect(ok).toHaveBeenCalledTimes(1);
    });

    it("编辑被拒绝：proposeEventUpdate 返回 false 并派发 event-update-denied", () => {
      const calendar = setup(AST_NO_PERMS);
      const ok = vi.fn();
      const denied = vi.fn();
      calendar.addEventListener("event-update", ok);
      calendar.addEventListener("event-update-denied", denied);
      expect(calendar.proposeEventUpdate(createMeetingEvent())).toBe(false);
      expect(ok).not.toHaveBeenCalled();
      expect(denied).toHaveBeenCalledTimes(1);
    });

    it("编辑被允许：派发 event-update", () => {
      const calendar = setup(AST_PERMS);
      const ok = vi.fn();
      calendar.addEventListener("event-update", ok);
      expect(calendar.proposeEventUpdate(createMeetingEvent())).toBe(true);
      expect(ok).toHaveBeenCalledTimes(1);
    });
  });
});

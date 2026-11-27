import { describe, it, expect } from "vitest";
import { EventDetailPluginRegistry } from "../plugins/EventDetailPluginRegistry";
import { defaultPlugin, appointmentPlugin } from "../plugins/built-in";
import type { Event } from "@calenderjs/event-model";
import type { EventDetailPlugin } from "../plugins/types";

function makeEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: "e1",
    type: "meeting",
    title: "团队会议",
    startTime: new Date("2026-01-01T10:00:00Z"),
    endTime: new Date("2026-01-01T11:00:00Z"),
    data: { attendees: ["a@example.com"], location: "会议室 A" },
    ...overrides,
  } as Event;
}

describe("EventDetailPluginRegistry", () => {
  it("register 后 describe 能匹配到对应 type 的插件", () => {
    const registry = new EventDetailPluginRegistry();
    registry.register(appointmentPlugin);
    registry.register(defaultPlugin);

    const result = registry.describe(makeEvent());
    expect(result.title).toBe("团队会议");
    expect(result.fields.find((f) => f.key === "attendees")?.value).toBe("a@example.com");
  });

  it("重复 register 同名插件抛错", () => {
    const registry = new EventDetailPluginRegistry();
    registry.register(appointmentPlugin);
    expect(() => registry.register(appointmentPlugin)).toThrow(
      "Plugin appointment is already registered",
    );
  });

  it("unregister 后不再匹配该插件，退回默认插件", () => {
    const registry = new EventDetailPluginRegistry();
    registry.register(appointmentPlugin);
    registry.register(defaultPlugin);
    registry.unregister("appointment");

    const result = registry.describe(makeEvent());
    expect(result.fields.find((f) => f.key === "attendees")).toBeUndefined();
    expect(result.fields.find((f) => f.key === "data")).toBeDefined();
  });

  it("按 priority 排序，优先级高的插件胜出", () => {
    const registry = new EventDetailPluginRegistry();
    const low: EventDetailPlugin = {
      name: "low",
      type: "meeting",
      priority: 0,
      supports: (e) => e.type === "meeting",
      describe: () => ({ title: "low", fields: [] }),
    };
    const high: EventDetailPlugin = {
      name: "high",
      type: "meeting",
      priority: 10,
      supports: (e) => e.type === "meeting",
      describe: () => ({ title: "high", fields: [] }),
    };
    registry.register(low);
    registry.register(high);

    expect(registry.describe(makeEvent()).title).toBe("high");
  });

  it("未设置 priority 的插件按默认值 0 参与排序", () => {
    const registry = new EventDetailPluginRegistry();
    const noPriority: EventDetailPlugin = {
      name: "no-priority",
      type: "meeting",
      supports: (e) => e.type === "meeting",
      describe: () => ({ title: "no-priority", fields: [] }),
    };
    const high: EventDetailPlugin = {
      name: "high",
      type: "meeting",
      priority: 1,
      supports: (e) => e.type === "meeting",
      describe: () => ({ title: "high", fields: [] }),
    };
    registry.register(noPriority);
    registry.register(high);

    expect(registry.describe(makeEvent()).title).toBe("high");
  });

  it("无 type 匹配插件时退到默认插件（type: '*'）", () => {
    const registry = new EventDetailPluginRegistry();
    registry.register(appointmentPlugin);
    registry.register(defaultPlugin);

    const result = registry.describe(makeEvent({ type: "holiday" }));
    expect(result.fields.find((f) => f.key === "data")).toBeDefined();
  });

  it("完全没有插件时返回兜底结构", () => {
    const registry = new EventDetailPluginRegistry();
    const result = registry.describe(makeEvent());
    expect(result).toEqual({ title: "团队会议", fields: [] });
  });

  it("supports 返回 false 时该插件不参与匹配", () => {
    const registry = new EventDetailPluginRegistry();
    const neverMatches: EventDetailPlugin = {
      name: "never",
      type: "meeting",
      supports: () => false,
      describe: () => ({ title: "never", fields: [] }),
    };
    registry.register(neverMatches);
    registry.register(defaultPlugin);

    expect(registry.describe(makeEvent()).fields.find((f) => f.key === "data")).toBeDefined();
  });
});

describe("built-in plugins", () => {
  it("defaultPlugin 对任意 event 返回通用字段", () => {
    const result = defaultPlugin.describe(makeEvent({ type: "anything" }));
    expect(result.fields.map((f) => f.key)).toEqual(["startTime", "endTime", "data"]);
  });

  it("appointmentPlugin 只支持 meeting 类型", () => {
    expect(appointmentPlugin.supports(makeEvent({ type: "meeting" }))).toBe(true);
    expect(appointmentPlugin.supports(makeEvent({ type: "holiday" }))).toBe(false);
  });

  it("appointmentPlugin 在 data 字段缺失时给出兜底文案", () => {
    const result = appointmentPlugin.describe(makeEvent({ data: {} }));
    expect(result.fields.find((f) => f.key === "attendees")?.value).toBe("无");
    expect(result.fields.find((f) => f.key === "location")?.value).toBe("未指定");
  });

  it("appointmentPlugin/defaultPlugin 在 data 为 undefined 时不报错", () => {
    const event = makeEvent({ data: undefined });
    expect(appointmentPlugin.describe(event).fields.find((f) => f.key === "attendees")?.value).toBe(
      "无",
    );
    expect(defaultPlugin.describe(event).fields.find((f) => f.key === "data")?.value).toBe("{}");
  });
});

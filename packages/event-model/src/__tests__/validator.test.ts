/**
 * Event 验证器测试
 */

import { describe, it, expect } from "vitest";
import {
  EventValidator,
  defaultEventValidator,
  EVENT_BASE_SCHEMA,
  type ValidationResult,
} from "../validator";
import type { Event } from "../Event";

describe("EventValidator", () => {
  const validator = new EventValidator();

  describe("validateBase", () => {
    it("应该验证有效的 Event 对象", () => {
      const event: Event = {
        id: "event-1",
        type: "meeting",
        title: "团队会议",
        startTime: new Date("2026-01-15T10:00:00Z"),
        endTime: new Date("2026-01-15T11:00:00Z"),
        extra: {
          attendees: ["user1@example.com"],
          location: "会议室 A",
        },
      };

      const result = validator.validateBase(event);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("应该拒绝缺少必需字段的 Event 对象", () => {
      const event = {
        id: "event-1",
        // 缺少 type, title, startTime, endTime
      } as any;

      const result = validator.validateBase(event);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.length).toBeGreaterThan(0);
    });

    it("应该拒绝无效的日期格式", () => {
      const event: Event = {
        id: "event-1",
        type: "meeting",
        title: "团队会议",
        startTime: "invalid-date" as any,
        endTime: new Date("2026-01-15T11:00:00Z"),
        extra: {},
      };

      const result = validator.validateBase(event);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it("应该验证包含 metadata 的 Event 对象", () => {
      const event: Event = {
        id: "event-1",
        type: "meeting",
        title: "团队会议",
        startTime: new Date("2026-01-15T10:00:00Z"),
        endTime: new Date("2026-01-15T11:00:00Z"),
        extra: {},
        metadata: {
          createdAt: new Date("2026-01-01T00:00:00Z"),
          updatedAt: new Date("2026-01-01T00:00:00Z"),
          createdBy: "user1",
          version: 1,
        },
      };

      const result = validator.validateBase(event);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });

  describe("validateExtra", () => {
    it("应该验证 Event.extra 符合指定的 JSON Schema", () => {
      const event: Event = {
        id: "event-1",
        type: "meeting",
        title: "团队会议",
        startTime: new Date("2026-01-15T10:00:00Z"),
        endTime: new Date("2026-01-15T11:00:00Z"),
        extra: {
          attendees: ["user1@example.com", "user2@example.com"],
          location: "会议室 A",
          priority: "normal",
        },
      };

      const extraSchema = {
        type: "object",
        required: ["attendees", "location"],
        properties: {
          attendees: {
            type: "array",
            items: {
              type: "string",
              format: "email",
            },
            minItems: 1,
          },
          location: {
            type: "string",
          },
          priority: {
            type: "string",
            enum: ["low", "normal", "high"],
          },
        },
        additionalProperties: false,
      };

      const result = validator.validateExtra(event, extraSchema);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("应该拒绝不符合 extra Schema 的 Event", () => {
      const event: Event = {
        id: "event-1",
        type: "meeting",
        title: "团队会议",
        startTime: new Date("2026-01-15T10:00:00Z"),
        endTime: new Date("2026-01-15T11:00:00Z"),
        extra: {
          // 缺少必需的 location 字段
          attendees: ["user1@example.com"],
        },
      };

      const extraSchema = {
        type: "object",
        required: ["attendees", "location"],
        properties: {
          attendees: {
            type: "array",
            items: {
              type: "string",
            },
          },
          location: {
            type: "string",
          },
        },
        additionalProperties: false,
      };

      const result = validator.validateExtra(event, extraSchema);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.length).toBeGreaterThan(0);
    });

    it("应该拒绝无效的 email 格式", () => {
      const event: Event = {
        id: "event-1",
        type: "meeting",
        title: "团队会议",
        startTime: new Date("2026-01-15T10:00:00Z"),
        endTime: new Date("2026-01-15T11:00:00Z"),
        extra: {
          attendees: ["invalid-email"],
        },
      };

      const extraSchema = {
        type: "object",
        properties: {
          attendees: {
            type: "array",
            items: {
              type: "string",
              format: "email",
            },
          },
        },
        additionalProperties: false,
      };

      const result = validator.validateExtra(event, extraSchema);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });

  describe("validateTimeLogic", () => {
    it("应该验证开始时间早于结束时间", () => {
      const event: Event = {
        id: "event-1",
        type: "meeting",
        title: "团队会议",
        startTime: new Date("2026-01-15T10:00:00Z"),
        endTime: new Date("2026-01-15T11:00:00Z"),
        extra: {},
      };

      const result = validator.validateTimeLogic(event);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("应该拒绝开始时间晚于或等于结束时间", () => {
      const event: Event = {
        id: "event-1",
        type: "meeting",
        title: "团队会议",
        startTime: new Date("2026-01-15T11:00:00Z"),
        endTime: new Date("2026-01-15T10:00:00Z"),
        extra: {},
      };

      const result = validator.validateTimeLogic(event);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("开始时间必须早于结束时间");
    });

    it("应该处理字符串格式的日期", () => {
      const event: Event = {
        id: "event-1",
        type: "meeting",
        title: "团队会议",
        startTime: "2026-01-15T10:00:00Z" as any,
        endTime: "2026-01-15T11:00:00Z" as any,
        extra: {},
      };

      const result = validator.validateTimeLogic(event);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });

  describe("validate", () => {
    it("应该使用 extraSchema 验证完整 Event", () => {
      const event: Event = {
        id: "event-1",
        type: "meeting",
        title: "团队会议",
        startTime: new Date("2026-01-15T10:00:00Z"),
        endTime: new Date("2026-01-15T11:00:00Z"),
        extra: {
          location: "会议室 A",
        },
      };

      const extraSchema = {
        type: "object",
        required: ["location"],
        properties: {
          location: {
            type: "string",
          },
        },
        additionalProperties: false,
      };

      const result = validator.validate(event, extraSchema);
      expect(result.valid).toBe(true);
    });

    it("应该只验证基础结构（当没有提供 dataSchema 时）", () => {
      const event: Event = {
        id: "event-1",
        type: "meeting",
        title: "团队会议",
        startTime: new Date("2026-01-15T10:00:00Z"),
        endTime: new Date("2026-01-15T11:00:00Z"),
        extra: {},
      };

      const result = validator.validate(event);
      expect(result.valid).toBe(true);
    });
  });

  describe("defaultEventValidator", () => {
    it("应该提供默认验证器实例", () => {
      expect(defaultEventValidator).toBeInstanceOf(EventValidator);
    });

    it("应该能够使用默认验证器验证 Event", () => {
      const event: Event = {
        id: "event-1",
        type: "meeting",
        title: "团队会议",
        startTime: new Date("2026-01-15T10:00:00Z"),
        endTime: new Date("2026-01-15T11:00:00Z"),
        extra: {},
      };

      const result = defaultEventValidator.validateBase(event);
      expect(result.valid).toBe(true);
    });
  });

  describe("EVENT_BASE_SCHEMA", () => {
    it("应该定义有效的 JSON Schema", () => {
      expect(EVENT_BASE_SCHEMA).toBeDefined();
      expect(EVENT_BASE_SCHEMA.type).toBe("object");
      expect(EVENT_BASE_SCHEMA.required).toContain("id");
      expect(EVENT_BASE_SCHEMA.required).toContain("type");
      expect(EVENT_BASE_SCHEMA.required).toContain("title");
      expect(EVENT_BASE_SCHEMA.required).toContain("startTime");
      expect(EVENT_BASE_SCHEMA.required).toContain("endTime");
    });

    it("应该包含时间敏感字段的 Schema 定义", () => {
      expect(EVENT_BASE_SCHEMA.properties).toBeDefined();
      expect(EVENT_BASE_SCHEMA.properties?.timeZone).toBeDefined();
      expect(EVENT_BASE_SCHEMA.properties?.allDay).toBeDefined();
      expect(EVENT_BASE_SCHEMA.properties?.recurring).toBeDefined();
      expect(EVENT_BASE_SCHEMA.properties?.parentEventId).toBeDefined();
      expect(EVENT_BASE_SCHEMA.properties?.recurrenceId).toBeDefined();
    });
  });

  describe("时间敏感字段验证", () => {
    it("应该验证包含 timeZone 的 Event", () => {
      const event: Event = {
        id: "event-1",
        type: "meeting",
        title: "团队会议",
        startTime: new Date("2026-01-15T10:00:00Z"),
        endTime: new Date("2026-01-15T11:00:00Z"),
        timeZone: "Asia/Shanghai",
      };

      const result = validator.validateBase(event);
      expect(result.valid).toBe(true);
    });

    it("应该验证包含 allDay 的 Event", () => {
      const event: Event = {
        id: "event-1",
        type: "holiday",
        title: "春节",
        startTime: new Date("2026-01-29T00:00:00Z"),
        endTime: new Date("2026-02-04T23:59:59Z"),
        allDay: true,
      };

      const result = validator.validateBase(event);
      expect(result.valid).toBe(true);
    });

    it("应该验证包含 recurring 的 Event", () => {
      const event: Event = {
        id: "event-1",
        type: "meeting",
        title: "每周例会",
        startTime: new Date("2026-01-15T10:00:00Z"),
        endTime: new Date("2026-01-15T11:00:00Z"),
        recurring: {
          frequency: "weekly",
          interval: 1,
          daysOfWeek: [1, 3, 5], // 周一、周三、周五
          endDate: new Date("2026-12-31T23:59:59Z"),
        },
      };

      const result = validator.validateBase(event);
      expect(result.valid).toBe(true);
    });

    it("应该验证包含 parentEventId 和 recurrenceId 的 Event", () => {
      const event: Event = {
        id: "event-2",
        type: "meeting",
        title: "每周例会",
        startTime: new Date("2026-01-22T10:00:00Z"),
        endTime: new Date("2026-01-22T11:00:00Z"),
        parentEventId: "event-1",
        recurrenceId: "2026-01-22",
      };

      const result = validator.validateBase(event);
      expect(result.valid).toBe(true);
    });

    it("应该验证完整的重复事件配置", () => {
      const event: Event = {
        id: "event-1",
        type: "meeting",
        title: "每月例会",
        startTime: new Date("2026-01-15T10:00:00Z"),
        endTime: new Date("2026-01-15T11:00:00Z"),
        timeZone: "Asia/Shanghai",
        recurring: {
          frequency: "monthly",
          interval: 1,
          dayOfMonth: 15,
          count: 12,
          excludeDates: [new Date("2026-07-15T10:00:00Z")],
          timeZone: "Asia/Shanghai",
        },
      };

      const result = validator.validateBase(event);
      expect(result.valid).toBe(true);
    });

    it("应该拒绝无效的 recurring frequency", () => {
      const event: Event = {
        id: "event-1",
        type: "meeting",
        title: "测试",
        startTime: new Date("2026-01-15T10:00:00Z"),
        endTime: new Date("2026-01-15T11:00:00Z"),
        recurring: {
          frequency: "invalid" as any,
          interval: 1,
        },
      };

      const result = validator.validateBase(event);
      expect(result.valid).toBe(false);
    });

    it("应该拒绝缺少 required 字段的 recurring", () => {
      const event: Event = {
        id: "event-1",
        type: "meeting",
        title: "测试",
        startTime: new Date("2026-01-15T10:00:00Z"),
        endTime: new Date("2026-01-15T11:00:00Z"),
        recurring: {
          frequency: "weekly",
          // 缺少 interval
        } as any,
      };

      const result = validator.validateBase(event);
      expect(result.valid).toBe(false);
    });

    it("应该验证 eventToJson 正确转换时间敏感字段", () => {
      const event: Event = {
        id: "event-1",
        type: "meeting",
        title: "测试",
        startTime: new Date("2026-01-15T10:00:00Z"),
        endTime: new Date("2026-01-15T11:00:00Z"),
        timeZone: "Asia/Shanghai",
        allDay: true,
        recurring: {
          frequency: "weekly",
          interval: 1,
          endDate: new Date("2026-12-31T23:59:59Z"),
          excludeDates: [new Date("2026-07-15T10:00:00Z")],
        },
        parentEventId: "parent-1",
        recurrenceId: "2026-01-15",
      };

      const result = validator.validateBase(event);
      expect(result.valid).toBe(true);
      
      // 验证 JSON 转换（通过 validateBase 内部调用 eventToJson）
      // 如果验证通过，说明转换正确
      expect(result.errors).toEqual([]);
    });
  });
});

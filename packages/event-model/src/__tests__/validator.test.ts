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
        data: {
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
        // 缺少 type, title, startTime, endTime, data
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
        data: {},
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
        data: {},
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

  describe("validateData", () => {
    it("应该验证 Event.data 符合指定的 JSON Schema", () => {
      const event: Event = {
        id: "event-1",
        type: "meeting",
        title: "团队会议",
        startTime: new Date("2026-01-15T10:00:00Z"),
        endTime: new Date("2026-01-15T11:00:00Z"),
        data: {
          attendees: ["user1@example.com", "user2@example.com"],
          location: "会议室 A",
          priority: "normal",
        },
      };

      const dataSchema = {
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

      const result = validator.validateData(event, dataSchema);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("应该拒绝不符合 data Schema 的 Event", () => {
      const event: Event = {
        id: "event-1",
        type: "meeting",
        title: "团队会议",
        startTime: new Date("2026-01-15T10:00:00Z"),
        endTime: new Date("2026-01-15T11:00:00Z"),
        data: {
          // 缺少必需的 location 字段
          attendees: ["user1@example.com"],
        },
      };

      const dataSchema = {
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

      const result = validator.validateData(event, dataSchema);
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
        data: {
          attendees: ["invalid-email"],
        },
      };

      const dataSchema = {
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

      const result = validator.validateData(event, dataSchema);
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
        data: {},
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
        data: {},
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
        data: {},
      };

      const result = validator.validateTimeLogic(event);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });

  describe("validate", () => {
    it("应该使用 dataSchema 验证完整 Event", () => {
      const event: Event = {
        id: "event-1",
        type: "meeting",
        title: "团队会议",
        startTime: new Date("2026-01-15T10:00:00Z"),
        endTime: new Date("2026-01-15T11:00:00Z"),
        data: {
          location: "会议室 A",
        },
      };

      const dataSchema = {
        type: "object",
        required: ["location"],
        properties: {
          location: {
            type: "string",
          },
        },
        additionalProperties: false,
      };

      const result = validator.validate(event, dataSchema);
      expect(result.valid).toBe(true);
    });

    it("应该只验证基础结构（当没有提供 dataSchema 时）", () => {
      const event: Event = {
        id: "event-1",
        type: "meeting",
        title: "团队会议",
        startTime: new Date("2026-01-15T10:00:00Z"),
        endTime: new Date("2026-01-15T11:00:00Z"),
        data: {},
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
        data: {},
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
      expect(EVENT_BASE_SCHEMA.required).toContain("data");
    });
  });
});

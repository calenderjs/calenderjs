/**
 * EventDataGenerator 测试
 *
 * 验证从 Event DSL（AST、EventTypeDefinition、DSL 文本）生成符合 Event Data Model（SSOT）的 Event 实例
 */

import { describe, it, expect } from "vitest";
import { EventDataGenerator } from "../EventDataGenerator";
import { EventValidator } from "@calenderjs/event-model";
import type { EventTypeAST } from "../../ast/types";
import type { EventTypeDefinition } from "../../types";

describe("EventDataGenerator", () => {
  const validator = new EventValidator();

  describe("从 EventTypeAST 生成 Event", () => {
    it("应该根据字段类型生成默认值，并符合 Event 数据模型", () => {
      const ast: EventTypeAST = {
        type: "meeting",
        name: "团队例会",
        fields: [
          { name: "agenda", type: "string" },
          { name: "attendeeCount", type: "number" },
          { name: "isRemote", type: "boolean" },
          { name: "contactEmail", type: "email" },
          { name: "tags", type: { type: "list", itemType: "string" } },
          {
            name: "priority",
            type: { type: "enum", values: ["low", "normal", "high"] },
            default: "normal",
          },
        ],
        validate: [],
        display: [
          { name: "color", value: "#4285f4" },
          { name: "icon", value: "meeting" },
        ],
        behavior: [],
      };

      const generator = new EventDataGenerator();
      const event = generator.generateEvent(ast);

      expect(event.id).toMatch(/^event-/);
      expect(event.type).toBe("meeting");
      expect(event.title).toBe("团队例会");
      expect(event.color).toBe("#4285f4");
      expect(event.icon).toBe("meeting");
      expect(event.startTime).toBeInstanceOf(Date);
      expect(event.endTime).toBeInstanceOf(Date);
      expect(event.endTime.getTime() - event.startTime.getTime()).toBe(60 * 60 * 1000);

      // 验证 data
      expect(event.data).toBeDefined();
      expect(event.data?.agenda).toBe("");
      expect(event.data?.attendeeCount).toBe(0);
      expect(event.data?.isRemote).toBe(false);
      expect(event.data?.contactEmail).toBe("user@example.com");
      expect(event.data?.tags).toEqual([]);
      expect(event.data?.priority).toBe("normal");

      // 通过 EventValidator 基础模型校验
      const baseResult = validator.validateBase(event);
      expect(baseResult.valid).toBe(true);
    });

    it("应该支持自定义 duration、overrides 和元数据", () => {
      const ast: EventTypeAST = {
        type: "interview",
        name: "技术面试",
        fields: [{ name: "candidate", type: "string" }],
        validate: [],
        display: [],
        behavior: [{ name: "defaultDuration" as any, value: 45 as any }],
      };

      const generator = new EventDataGenerator();
      const startTime = new Date("2026-06-01T09:00:00Z");
      const event = generator.generateEvent(ast, {
        startTime,
        title: "张三的一面",
        data: { candidate: "张三" },
      });

      expect(event.title).toBe("张三的一面");
      expect(event.startTime.toISOString()).toBe("2026-06-01T09:00:00.000Z");
      // 45 分钟时长
      expect(event.endTime.toISOString()).toBe("2026-06-01T09:45:00.000Z");
      expect(event.data?.candidate).toBe("张三");
      expect(event.metadata?.createdAt).toBeInstanceOf(Date);

      const baseResult = validator.validateBase(event);
      expect(baseResult.valid).toBe(true);
    });

    it("应该处理 recurring 规则", () => {
      const ast: EventTypeAST = {
        type: "sync",
        name: "每日站会",
        fields: [],
        validate: [],
        display: [],
        behavior: [],
        recurring: {
          frequency: "daily",
          interval: 1,
          count: 10,
        },
      };

      const generator = new EventDataGenerator();
      const event = generator.generateEvent(ast);

      expect(event.recurring).toBeDefined();
      expect(event.recurring?.frequency).toBe("daily");
      expect(event.recurring?.interval).toBe(1);
      expect(event.recurring?.count).toBe(10);
    });
  });

  describe("从 EventTypeDefinition 生成 Event", () => {
    it("应该正确映射 EventTypeDefinition 到 Event", () => {
      const typeDef: EventTypeDefinition = {
        id: "doctor-appointment",
        name: "医生预约",
        fields: [
          { name: "doctor", type: "string", required: true },
          { name: "department", type: "string" },
          {
            name: "severity",
            type: "enum",
            enum: ["mild", "severe"],
            default: "mild",
          },
        ],
        display: {
          color: "#ea4335",
          icon: "hospital",
          titleTemplate: "门诊: ${doctor}",
        },
        behavior: {
          draggable: false,
          resizable: false,
          editable: true,
          deletable: true,
        },
      };

      const generator = new EventDataGenerator({ timeZone: "Asia/Shanghai" });
      const event = generator.generateEvent(typeDef, {
        data: { doctor: "李医生", department: "全科" },
      });

      expect(event.type).toBe("doctor-appointment");
      expect(event.title).toBe("门诊: 李医生");
      expect(event.color).toBe("#ea4335");
      expect(event.icon).toBe("hospital");
      expect(event.timeZone).toBe("Asia/Shanghai");
      expect(event.data?.doctor).toBe("李医生");
      expect(event.data?.department).toBe("全科");
      expect(event.data?.severity).toBe("mild");

      const baseResult = validator.validateBase(event);
      expect(baseResult.valid).toBe(true);
    });
  });

  describe("从 DSL 文本生成 Event", () => {
    it("应该直接解析 DSL 文本并生成有效 Event", () => {
      const dslText = `type: team_sync
name: "团队同步会"
description: "跨时区团队日常同步"

fields:
  - project: string, required
  - meetingLink: string

display:
  color: "#34a853"
  icon: "sync"

behavior:
  editable: true
`;

      const generator = new EventDataGenerator();
      const event = generator.generateEvent(dslText, {
        data: { project: "CalenderJS" },
      });

      expect(event.type).toBe("team_sync");
      expect(event.title).toBe("团队同步会");
      expect(event.color).toBe("#34a853");
      expect(event.icon).toBe("sync");
      expect(event.data?.project).toBe("CalenderJS");
      expect(event.data?.meetingLink).toBe("");

      const baseResult = validator.validateBase(event);
      expect(baseResult.valid).toBe(true);
    });
  });

  describe("批量生成 generateEvents", () => {
    it("应该批量生成多个事件，支持索引 override 工厂", () => {
      const dslText = `type: slot
name: "预约位"
fields:
  - slotIndex: number
`;

      const generator = new EventDataGenerator();
      const baseTime = new Date("2026-10-01T08:00:00Z");
      const events = generator.generateEvents(dslText, 3, (index) => ({
        startTime: new Date(baseTime.getTime() + index * 60 * 60 * 1000),
        data: { slotIndex: index + 1 },
      }));

      expect(events).toHaveLength(3);
      expect(events[0].startTime.toISOString()).toBe("2026-10-01T08:00:00.000Z");
      expect(events[1].startTime.toISOString()).toBe("2026-10-01T09:00:00.000Z");
      expect(events[2].startTime.toISOString()).toBe("2026-10-01T10:00:00.000Z");
      expect(events[0].data?.slotIndex).toBe(1);
      expect(events[1].data?.slotIndex).toBe(2);
      expect(events[2].data?.slotIndex).toBe(3);

      for (const ev of events) {
        expect(validator.validateBase(ev).valid).toBe(true);
      }
    });
  });
});

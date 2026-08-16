/**
 * WSX @state 日期辅助函数测试
 */

import { describe, it, expect } from "vitest";
import {
  toStateIso,
  fromStateIso,
  toStateIsoOrUnselected,
  normalizeEventForState,
  normalizeEventsForState,
  UNSELECTED_DATE_ISO,
} from "../state-date";

describe("state-date", () => {
  describe("toStateIso / fromStateIso", () => {
    it("Date 与 ISO 字符串互相转换且可调用 Date 方法", () => {
      const source = new Date(2024, 0, 15, 10, 30, 0);
      const iso = toStateIso(source);
      const restored = fromStateIso(iso);

      expect(typeof iso).toBe("string");
      expect(restored.getFullYear()).toBe(2024);
      expect(restored.getMonth()).toBe(0);
      expect(restored.getDate()).toBe(15);
      expect(restored.getHours()).toBe(10);
    });

    it("接受 ISO 字符串并规范化", () => {
      const iso = toStateIso("2024-01-15T10:00:00.000Z");
      expect(iso).toBe("2024-01-15T10:00:00.000Z");
    });

    it("无效字符串抛错", () => {
      expect(() => toStateIso("not-a-date")).toThrow(/Invalid date/);
    });
  });

  describe("toStateIsoOrUnselected", () => {
    it("空值返回未选择 ISO", () => {
      expect(toStateIsoOrUnselected(undefined)).toBe(UNSELECTED_DATE_ISO);
      expect(toStateIsoOrUnselected(null)).toBe(UNSELECTED_DATE_ISO);
    });

    it("无效字符串返回未选择 ISO", () => {
      expect(toStateIsoOrUnselected("bad")).toBe(UNSELECTED_DATE_ISO);
    });
  });

  describe("normalizeEventForState", () => {
    it("把 startTime/endTime 写成 ISO 字符串", () => {
      const normalized = normalizeEventForState({
        id: "e1",
        startTime: new Date("2024-01-15T10:00:00.000Z"),
        endTime: new Date("2024-01-15T11:00:00.000Z"),
      });

      expect(typeof normalized.startTime).toBe("string");
      expect(typeof normalized.endTime).toBe("string");
      expect(normalized.startTime).toBe("2024-01-15T10:00:00.000Z");
      expect(normalized.endTime).toBe("2024-01-15T11:00:00.000Z");
    });

    it("批量规范事件列表", () => {
      const list = normalizeEventsForState([
        {
          startTime: new Date("2024-01-15T10:00:00.000Z"),
          endTime: new Date("2024-01-15T11:00:00.000Z"),
        },
      ]);
      expect(list).toHaveLength(1);
      expect(typeof list[0].startTime).toBe("string");
    });
  });
});

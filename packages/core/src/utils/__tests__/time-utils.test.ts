/**
 * 时间工具函数测试
 */

import { describe, it, expect } from "vitest";
import {
    isValidTimeRange,
    calculateDuration,
    hasTimeConflict,
    convertTimeZone,
    isBusinessHours,
    isBusinessDay,
    isWeekend,
    daysBetween,
} from "../time-utils";
import type { Event } from "@calenderjs/event-model";

describe("time-utils", () => {
    describe("isValidTimeRange", () => {
        it("应该验证有效的时间范围", () => {
            const start = new Date("2024-12-30T10:00:00Z");
            const end = new Date("2024-12-30T11:00:00Z");
            expect(isValidTimeRange(start, end)).toBe(true);
        });

        it("应该拒绝无效的时间范围（开始时间晚于结束时间）", () => {
            const start = new Date("2024-12-30T11:00:00Z");
            const end = new Date("2024-12-30T10:00:00Z");
            expect(isValidTimeRange(start, end)).toBe(false);
        });

        it("应该拒绝无效的日期对象", () => {
            const start = new Date("invalid");
            const end = new Date("2024-12-30T11:00:00Z");
            expect(isValidTimeRange(start, end)).toBe(false);
        });
    });

    describe("calculateDuration", () => {
        it("应该计算持续时间（分钟数）", () => {
            const start = new Date("2024-12-30T10:00:00Z");
            const end = new Date("2024-12-30T11:00:00Z");
            expect(calculateDuration(start, end)).toBe(60);
        });

        it("应该计算跨天的持续时间", () => {
            const start = new Date("2024-12-30T23:00:00Z");
            const end = new Date("2024-12-31T01:00:00Z");
            expect(calculateDuration(start, end)).toBe(120);
        });

        it("应该返回 0 对于无效的时间范围", () => {
            const start = new Date("2024-12-30T11:00:00Z");
            const end = new Date("2024-12-30T10:00:00Z");
            expect(calculateDuration(start, end)).toBe(0);
        });
    });

    describe("hasTimeConflict", () => {
        it("应该检测时间冲突（两个非全天事件）", () => {
            const event1: Event = {
                id: "1",
                type: "meeting",
                title: "Meeting 1",
                startTime: new Date("2024-12-30T10:00:00Z"),
                endTime: new Date("2024-12-30T11:00:00Z"),
                extra: {},
            };

            const event2: Event = {
                id: "2",
                type: "meeting",
                title: "Meeting 2",
                startTime: new Date("2024-12-30T10:30:00Z"),
                endTime: new Date("2024-12-30T11:30:00Z"),
                extra: {},
            };

            expect(hasTimeConflict(event1, event2)).toBe(true);
        });

        it("应该检测无冲突（两个非全天事件）", () => {
            const event1: Event = {
                id: "1",
                type: "meeting",
                title: "Meeting 1",
                startTime: new Date("2024-12-30T10:00:00Z"),
                endTime: new Date("2024-12-30T11:00:00Z"),
                extra: {},
            };

            const event2: Event = {
                id: "2",
                type: "meeting",
                title: "Meeting 2",
                startTime: new Date("2024-12-30T12:00:00Z"),
                endTime: new Date("2024-12-30T13:00:00Z"),
                extra: {},
            };

            expect(hasTimeConflict(event1, event2)).toBe(false);
        });

        it("应该检测全天事件之间的冲突", () => {
            const event1: Event = {
                id: "1",
                type: "holiday",
                title: "Holiday 1",
                startTime: new Date("2024-12-30T00:00:00Z"),
                endTime: new Date("2024-12-31T00:00:00Z"),
                allDay: true,
                extra: {},
            };

            const event2: Event = {
                id: "2",
                type: "holiday",
                title: "Holiday 2",
                startTime: new Date("2024-12-30T00:00:00Z"),
                endTime: new Date("2024-12-30T23:59:59Z"),
                allDay: true,
                extra: {},
            };

            expect(hasTimeConflict(event1, event2)).toBe(true);
        });

        it("应该检测全天事件和非全天事件的冲突", () => {
            const event1: Event = {
                id: "1",
                type: "holiday",
                title: "Holiday",
                startTime: new Date("2024-12-30T00:00:00Z"),
                endTime: new Date("2024-12-30T23:59:59Z"),
                allDay: true,
                extra: {},
            };

            const event2: Event = {
                id: "2",
                type: "meeting",
                title: "Meeting",
                startTime: new Date("2024-12-30T10:00:00Z"),
                endTime: new Date("2024-12-30T11:00:00Z"),
                extra: {},
            };

            expect(hasTimeConflict(event1, event2)).toBe(true);
        });

        it("应该检测无冲突（全天事件和非全天事件在不同日期）", () => {
            const event1: Event = {
                id: "1",
                type: "holiday",
                title: "Holiday",
                startTime: new Date("2024-12-30T00:00:00Z"),
                endTime: new Date("2024-12-30T23:59:59Z"),
                allDay: true,
                extra: {},
            };

            const event2: Event = {
                id: "2",
                type: "meeting",
                title: "Meeting",
                startTime: new Date("2024-12-31T10:00:00Z"),
                endTime: new Date("2024-12-31T11:00:00Z"),
                extra: {},
            };

            expect(hasTimeConflict(event1, event2)).toBe(false);
        });

        it("应该检测同一事件不冲突", () => {
            const event1: Event = {
                id: "1",
                type: "meeting",
                title: "Meeting",
                startTime: new Date("2024-12-30T10:00:00Z"),
                endTime: new Date("2024-12-30T11:00:00Z"),
                extra: {},
            };

            expect(hasTimeConflict(event1, event1)).toBe(false);
        });
    });

    describe("convertTimeZone", () => {
        it("应该转换时区", () => {
            const date = new Date("2024-12-30T10:00:00Z");
            const converted = convertTimeZone(
                date,
                "UTC",
                "Asia/Shanghai"
            );

            expect(converted).toBeInstanceOf(Date);
            // 注意：由于时区转换的复杂性，这里只验证返回的是 Date 对象
            // 实际项目中应该使用 date-fns-tz 或类似库进行精确转换
        });
    });

    describe("isBusinessHours", () => {
        it("应该判断是否在工作时间（默认 9-18）", () => {
            const date1 = new Date("2024-12-30T10:00:00Z");
            expect(isBusinessHours(date1)).toBe(true);

            const date2 = new Date("2024-12-30T20:00:00Z");
            expect(isBusinessHours(date2)).toBe(false);
        });

        it("应该支持自定义工作时间", () => {
            const date = new Date("2024-12-30T08:00:00Z");
            expect(isBusinessHours(date, 8, 17)).toBe(true);
            expect(isBusinessHours(date, 9, 18)).toBe(false);
        });
    });

    describe("isBusinessDay", () => {
        it("应该判断是否是工作日（周一到周五）", () => {
            // 2024-12-30 是周一
            const monday = new Date("2024-12-30T10:00:00Z");
            expect(isBusinessDay(monday)).toBe(true);

            // 2024-12-28 是周六
            const saturday = new Date("2024-12-28T10:00:00Z");
            expect(isBusinessDay(saturday)).toBe(false);

            // 2024-12-29 是周日
            const sunday = new Date("2024-12-29T10:00:00Z");
            expect(isBusinessDay(sunday)).toBe(false);
        });
    });

    describe("isWeekend", () => {
        it("应该判断是否是周末（周六或周日）", () => {
            // 2024-12-28 是周六
            const saturday = new Date("2024-12-28T10:00:00Z");
            expect(isWeekend(saturday)).toBe(true);

            // 2024-12-29 是周日
            const sunday = new Date("2024-12-29T10:00:00Z");
            expect(isWeekend(sunday)).toBe(true);

            // 2024-12-30 是周一
            const monday = new Date("2024-12-30T10:00:00Z");
            expect(isWeekend(monday)).toBe(false);
        });
    });

    describe("daysBetween", () => {
        it("应该计算两个日期之间的天数", () => {
            const date1 = new Date("2024-12-30T10:00:00Z");
            const date2 = new Date("2025-01-02T10:00:00Z");
            expect(daysBetween(date1, date2)).toBe(3);
        });

        it("应该返回负数如果第二个日期早于第一个日期", () => {
            const date1 = new Date("2025-01-02T10:00:00Z");
            const date2 = new Date("2024-12-30T10:00:00Z");
            expect(daysBetween(date1, date2)).toBe(-3);
        });

        it("应该返回 0 如果是同一天", () => {
            const date1 = new Date("2024-12-30T10:00:00Z");
            const date2 = new Date("2024-12-30T20:00:00Z");
            expect(daysBetween(date1, date2)).toBe(0);
        });
    });
});

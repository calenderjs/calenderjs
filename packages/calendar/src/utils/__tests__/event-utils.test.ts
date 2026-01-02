/**
 * 事件工具函数测试
 */

import { describe, it, expect } from "vitest";
import type { Event } from "@calenderjs/event-model";
import {
    groupEventsByDate,
    getEventsForDate,
    getEventsInRange,
    sortEventsByTime,
    isEventInTimeRange,
    calculateEventPosition,
} from "../event-utils";

// 创建测试事件
function createTestEvent(overrides: Partial<Event> = {}): Event {
    const now = new Date();
    return {
        id: "event-1",
        type: "meeting",
        title: "测试事件",
        startTime: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        endTime: new Date(now.getTime() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
        data: {},
        ...overrides,
    };
}

describe("event-utils", () => {
    describe("groupEventsByDate", () => {
        it("应该按日期分组事件", () => {
            const events = [
                createTestEvent({
                    id: "event-1",
                    startTime: new Date("2024-01-15T10:00:00"),
                }),
                createTestEvent({
                    id: "event-2",
                    startTime: new Date("2024-01-15T14:00:00"),
                }),
                createTestEvent({
                    id: "event-3",
                    startTime: new Date("2024-01-16T10:00:00"),
                }),
            ];

            const grouped = groupEventsByDate(events);

            expect(grouped.size).toBe(2);
            expect(grouped.get("2024-01-15")?.length).toBe(2);
            expect(grouped.get("2024-01-16")?.length).toBe(1);
        });

        it("应该处理空事件列表", () => {
            const grouped = groupEventsByDate([]);

            expect(grouped.size).toBe(0);
        });
    });

    describe("getEventsForDate", () => {
        it("应该获取指定日期的事件", () => {
            // 使用本地时间创建日期，避免时区问题
            const targetDate = new Date(2024, 0, 15); // 2024年1月15日
            const events = [
                createTestEvent({
                    id: "event-1",
                    startTime: new Date(2024, 0, 15, 10, 0, 0), // 2024年1月15日 10:00
                }),
                createTestEvent({
                    id: "event-2",
                    startTime: new Date(2024, 0, 16, 10, 0, 0), // 2024年1月16日 10:00
                }),
            ];

            const dayEvents = getEventsForDate(events, targetDate);

            expect(dayEvents.length).toBe(1);
            expect(dayEvents[0].id).toBe("event-1");
        });

        it("应该处理没有事件的情况", () => {
            const targetDate = new Date("2024-01-15");
            const events: Event[] = [];

            const dayEvents = getEventsForDate(events, targetDate);

            expect(dayEvents.length).toBe(0);
        });
    });

    describe("getEventsInRange", () => {
        it("应该获取日期范围内的事件", () => {
            const startDate = new Date("2024-01-15");
            const endDate = new Date("2024-01-17");
            const events = [
                createTestEvent({
                    id: "event-1",
                    startTime: new Date("2024-01-14T10:00:00"),
                }),
                createTestEvent({
                    id: "event-2",
                    startTime: new Date("2024-01-15T10:00:00"),
                }),
                createTestEvent({
                    id: "event-3",
                    startTime: new Date("2024-01-16T10:00:00"),
                }),
                createTestEvent({
                    id: "event-4",
                    startTime: new Date("2024-01-18T10:00:00"),
                }),
            ];

            const rangeEvents = getEventsInRange(events, startDate, endDate);

            expect(rangeEvents.length).toBe(2);
            expect(rangeEvents.map((e) => e.id)).toEqual(["event-2", "event-3"]);
        });
    });

    describe("sortEventsByTime", () => {
        it("应该按开始时间排序事件", () => {
            const events = [
                createTestEvent({
                    id: "event-1",
                    startTime: new Date("2024-01-15T14:00:00"),
                }),
                createTestEvent({
                    id: "event-2",
                    startTime: new Date("2024-01-15T10:00:00"),
                }),
                createTestEvent({
                    id: "event-3",
                    startTime: new Date("2024-01-15T12:00:00"),
                }),
            ];

            const sorted = sortEventsByTime(events);

            expect(sorted[0].id).toBe("event-2");
            expect(sorted[1].id).toBe("event-3");
            expect(sorted[2].id).toBe("event-1");
        });

        it("应该按结束时间作为次要排序条件", () => {
            const events = [
                createTestEvent({
                    id: "event-1",
                    startTime: new Date("2024-01-15T10:00:00"),
                    endTime: new Date("2024-01-15T12:00:00"),
                }),
                createTestEvent({
                    id: "event-2",
                    startTime: new Date("2024-01-15T10:00:00"),
                    endTime: new Date("2024-01-15T11:00:00"),
                }),
            ];

            const sorted = sortEventsByTime(events);

            expect(sorted[0].id).toBe("event-2");
            expect(sorted[1].id).toBe("event-1");
        });
    });

    describe("isEventInTimeRange", () => {
        it("应该判断事件是否在时间范围内", () => {
            const event = createTestEvent({
                startTime: new Date("2024-01-15T10:00:00"),
                endTime: new Date("2024-01-15T12:00:00"),
            });
            const startTime = new Date("2024-01-15T09:00:00");
            const endTime = new Date("2024-01-15T13:00:00");

            expect(isEventInTimeRange(event, startTime, endTime)).toBe(true);
        });

        it("应该判断事件是否不在时间范围内", () => {
            const event = createTestEvent({
                startTime: new Date("2024-01-15T14:00:00"),
                endTime: new Date("2024-01-15T16:00:00"),
            });
            const startTime = new Date("2024-01-15T09:00:00");
            const endTime = new Date("2024-01-15T13:00:00");

            expect(isEventInTimeRange(event, startTime, endTime)).toBe(false);
        });
    });

    describe("calculateEventPosition", () => {
        it("应该计算事件在时间轴上的位置", () => {
            const event = createTestEvent({
                startTime: new Date("2024-01-15T10:00:00"),
                endTime: new Date("2024-01-15T12:00:00"),
            });
            const dayStart = new Date("2024-01-15T00:00:00");
            const dayEnd = new Date("2024-01-15T23:59:59");

            const position = calculateEventPosition(event, dayStart, dayEnd);

            expect(position).toHaveProperty("top");
            expect(position).toHaveProperty("height");
            expect(position.top).toBeGreaterThanOrEqual(0);
            expect(position.top).toBeLessThanOrEqual(100);
            expect(position.height).toBeGreaterThan(0);
            expect(position.height).toBeLessThanOrEqual(100);
        });

        it("应该处理跨天的事件", () => {
            const event = createTestEvent({
                startTime: new Date("2024-01-15T22:00:00"),
                endTime: new Date("2024-01-16T02:00:00"),
            });
            const dayStart = new Date("2024-01-15T00:00:00");
            const dayEnd = new Date("2024-01-15T23:59:59");

            const position = calculateEventPosition(event, dayStart, dayEnd);

            expect(position.top).toBeGreaterThanOrEqual(0);
            expect(position.height).toBeGreaterThan(0);
        });
    });
});

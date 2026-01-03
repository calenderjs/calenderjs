/**
 * 重复事件生成工具测试
 */

import { describe, it, expect } from "vitest";
import { generateRecurringInstances } from "../recurring-utils";
import type { Event, RecurringRule } from "@calenderjs/event-model";

describe("generateRecurringInstances", () => {
    const baseEvent: Event = {
        id: "event-1",
        type: "meeting",
        title: "Test Meeting",
        startTime: new Date("2024-12-30T10:00:00Z"),
        endTime: new Date("2024-12-30T11:00:00Z"),
        extra: {},
    };

    describe("daily 重复", () => {
        it("应该生成 daily 重复实例（使用 count）", () => {
            const recurringRule: RecurringRule = {
                frequency: "daily",
                interval: 1,
                count: 5,
            };

            const instances = generateRecurringInstances(baseEvent, recurringRule);
            expect(instances).toHaveLength(5);
            expect(instances[0].startTime).toEqual(new Date("2024-12-30T10:00:00Z"));
            expect(instances[1].startTime).toEqual(new Date("2024-12-31T10:00:00Z"));
            expect(instances[2].startTime).toEqual(new Date("2025-01-01T10:00:00Z"));
            expect(instances[0].parentEventId).toBe("event-1");
            expect(instances[0].recurrenceId).toBe("event-1-1");
        });

        it("应该生成 daily 重复实例（使用 endDate）", () => {
            const recurringRule: RecurringRule = {
                frequency: "daily",
                interval: 1,
                endDate: new Date("2025-01-03T10:00:00Z"),
            };

            const instances = generateRecurringInstances(baseEvent, recurringRule);
            expect(instances.length).toBeGreaterThan(0);
            expect(instances[instances.length - 1].startTime.getTime()).toBeLessThanOrEqual(
                new Date("2025-01-03T10:00:00Z").getTime()
            );
        });

        it("应该支持 interval > 1（每 N 天）", () => {
            const recurringRule: RecurringRule = {
                frequency: "daily",
                interval: 2,
                count: 3,
            };

            const instances = generateRecurringInstances(baseEvent, recurringRule);
            expect(instances).toHaveLength(3);
            expect(instances[0].startTime).toEqual(new Date("2024-12-30T10:00:00Z"));
            expect(instances[1].startTime).toEqual(new Date("2025-01-01T10:00:00Z"));
            expect(instances[2].startTime).toEqual(new Date("2025-01-03T10:00:00Z"));
        });

        it("应该排除 excludeDates 中的日期", () => {
            const recurringRule: RecurringRule = {
                frequency: "daily",
                interval: 1,
                count: 5,
                excludeDates: [new Date("2025-01-01T10:00:00Z")],
            };

            const instances = generateRecurringInstances(baseEvent, recurringRule);
            expect(instances).toHaveLength(5);
            // 检查是否排除了 2025-01-01
            const hasExcludedDate = instances.some(
                (inst) => inst.startTime.toISOString().split("T")[0] === "2025-01-01"
            );
            expect(hasExcludedDate).toBe(false);
        });
    });

    describe("weekly 重复", () => {
        it("应该生成 weekly 重复实例（使用 daysOfWeek）", () => {
            const recurringRule: RecurringRule = {
                frequency: "weekly",
                interval: 1,
                daysOfWeek: [1, 3, 5], // 周一、三、五
                count: 6,
            };

            const instances = generateRecurringInstances(baseEvent, recurringRule);
            expect(instances.length).toBeGreaterThan(0);
            // 验证所有实例都是周一、三或五
            instances.forEach((inst) => {
                const dayOfWeek = inst.startTime.getUTCDay();
                expect([1, 3, 5]).toContain(dayOfWeek);
            });
        });

        it("应该支持 interval > 1（每 N 周）", () => {
            const recurringRule: RecurringRule = {
                frequency: "weekly",
                interval: 2,
                daysOfWeek: [1], // 每两周的周一
                count: 3,
            };

            const instances = generateRecurringInstances(baseEvent, recurringRule);
            expect(instances).toHaveLength(3);
        });

        it("应该排除 excludeDates 中的日期", () => {
            const recurringRule: RecurringRule = {
                frequency: "weekly",
                interval: 1,
                daysOfWeek: [1, 3, 5],
                count: 10,
                excludeDates: [new Date("2025-01-01T10:00:00Z")],
            };

            const instances = generateRecurringInstances(baseEvent, recurringRule);
            const hasExcludedDate = instances.some(
                (inst) => inst.startTime.toISOString().split("T")[0] === "2025-01-01"
            );
            expect(hasExcludedDate).toBe(false);
        });
    });

    describe("monthly 重复", () => {
        it("应该生成 monthly 重复实例（使用 dayOfMonth）", () => {
            const recurringRule: RecurringRule = {
                frequency: "monthly",
                interval: 1,
                dayOfMonth: 15,
                count: 3,
            };

            const instances = generateRecurringInstances(baseEvent, recurringRule);
            expect(instances).toHaveLength(3);
            instances.forEach((inst) => {
                expect(inst.startTime.getUTCDate()).toBe(15);
            });
        });

        it("应该处理月份天数不足的情况（如 2 月 31 日）", () => {
            const eventOn31st: Event = {
                ...baseEvent,
                startTime: new Date("2024-01-31T10:00:00Z"),
                endTime: new Date("2024-01-31T11:00:00Z"),
            };

            const recurringRule: RecurringRule = {
                frequency: "monthly",
                interval: 1,
                dayOfMonth: 31,
                count: 3,
            };

            const instances = generateRecurringInstances(eventOn31st, recurringRule);
            expect(instances.length).toBeGreaterThan(0);
            // 2 月只有 28/29 天，应该使用该月的最后一天
            const febInstance = instances.find(
                (inst) => inst.startTime.getUTCMonth() === 1 // 2 月（0-based）
            );
            if (febInstance) {
                expect(febInstance.startTime.getUTCDate()).toBeLessThanOrEqual(29);
            }
        });

        it("应该支持 interval > 1（每 N 个月）", () => {
            const recurringRule: RecurringRule = {
                frequency: "monthly",
                interval: 2,
                dayOfMonth: 15,
                count: 3,
            };

            const instances = generateRecurringInstances(baseEvent, recurringRule);
            expect(instances).toHaveLength(3);
        });
    });

    describe("yearly 重复", () => {
        it("应该生成 yearly 重复实例", () => {
            const recurringRule: RecurringRule = {
                frequency: "yearly",
                interval: 1,
                count: 3,
            };

            const instances = generateRecurringInstances(baseEvent, recurringRule);
            expect(instances).toHaveLength(3);
            expect(instances[0].startTime).toEqual(new Date("2024-12-30T10:00:00Z"));
            expect(instances[1].startTime).toEqual(new Date("2025-12-30T10:00:00Z"));
            expect(instances[2].startTime).toEqual(new Date("2026-12-30T10:00:00Z"));
        });

        it("应该支持 interval > 1（每 N 年）", () => {
            const recurringRule: RecurringRule = {
                frequency: "yearly",
                interval: 2,
                count: 3,
            };

            const instances = generateRecurringInstances(baseEvent, recurringRule);
            expect(instances).toHaveLength(3);
            expect(instances[0].startTime.getUTCFullYear()).toBe(2024);
            expect(instances[1].startTime.getUTCFullYear()).toBe(2026);
            expect(instances[2].startTime.getUTCFullYear()).toBe(2028);
        });
    });

    describe("实例属性", () => {
        it("应该正确设置 parentEventId 和 recurrenceId", () => {
            const recurringRule: RecurringRule = {
                frequency: "daily",
                interval: 1,
                count: 3,
            };

            const instances = generateRecurringInstances(baseEvent, recurringRule);
            expect(instances[0].parentEventId).toBe("event-1");
            expect(instances[0].recurrenceId).toBe("event-1-1");
            expect(instances[1].recurrenceId).toBe("event-1-2");
            expect(instances[2].recurrenceId).toBe("event-1-3");
        });

        it("应该移除实例的 recurring 规则", () => {
            const eventWithRecurring: Event = {
                ...baseEvent,
                recurring: {
                    frequency: "daily",
                    interval: 1,
                    count: 5,
                },
            };

            const recurringRule: RecurringRule = {
                frequency: "daily",
                interval: 1,
                count: 2,
            };

            const instances = generateRecurringInstances(
                eventWithRecurring,
                recurringRule
            );
            instances.forEach((inst) => {
                expect(inst.recurring).toBeUndefined();
            });
        });

        it("应该保持原始事件的持续时间", () => {
            const recurringRule: RecurringRule = {
                frequency: "daily",
                interval: 1,
                count: 2,
            };

            const instances = generateRecurringInstances(baseEvent, recurringRule);
            instances.forEach((inst) => {
                const duration =
                    inst.endTime.getTime() - inst.startTime.getTime();
                const originalDuration =
                    baseEvent.endTime.getTime() - baseEvent.startTime.getTime();
                expect(duration).toBe(originalDuration);
            });
        });
    });
});

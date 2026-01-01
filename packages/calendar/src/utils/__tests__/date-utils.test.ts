/**
 * 日期工具函数测试
 */

import { describe, it, expect } from "vitest";
import {
    getMonthDates,
    getWeekDates,
    isSameDay,
    isSameMonth,
    getTimeString,
    formatDateKey,
} from "../date-utils";

describe("date-utils", () => {
    describe("getMonthDates", () => {
        it("应该返回指定月份的所有日期", () => {
            const date = new Date("2024-01-15");
            const monthDates = getMonthDates(date);

            expect(monthDates.length).toBeGreaterThan(0);
            expect(monthDates[0]).toBeInstanceOf(Date);
        });

        it("应该包含上个月的日期（如果月份第一天不是周日）", () => {
            const date = new Date("2024-01-15");
            const monthDates = getMonthDates(date);

            // 1月1日是周一，所以应该包含上个月的日期
            expect(monthDates.length).toBeGreaterThanOrEqual(28);
        });
    });

    describe("getWeekDates", () => {
        it("应该返回指定日期所在周的所有日期", () => {
            const date = new Date("2024-01-15");
            const weekDates = getWeekDates(date);

            expect(weekDates.length).toBe(7);
            weekDates.forEach((d) => {
                expect(d).toBeInstanceOf(Date);
            });
        });

        it("应该从周一开始", () => {
            const date = new Date("2024-01-15"); // 周一
            const weekDates = getWeekDates(date);

            expect(weekDates[0].getDay()).toBe(1); // 周一（根据 getWeekStart 实现）
        });
    });

    describe("isSameDay", () => {
        it("应该正确判断同一天", () => {
            const date1 = new Date("2024-01-15T10:00:00");
            const date2 = new Date("2024-01-15T20:00:00");

            expect(isSameDay(date1, date2)).toBe(true);
        });

        it("应该正确判断不同天", () => {
            const date1 = new Date("2024-01-15");
            const date2 = new Date("2024-01-16");

            expect(isSameDay(date1, date2)).toBe(false);
        });
    });

    describe("isSameMonth", () => {
        it("应该正确判断同一月", () => {
            const date1 = new Date("2024-01-15");
            const date2 = new Date("2024-01-20");

            expect(isSameMonth(date1, date2)).toBe(true);
        });

        it("应该正确判断不同月", () => {
            const date1 = new Date("2024-01-15");
            const date2 = new Date("2024-02-15");

            expect(isSameMonth(date1, date2)).toBe(false);
        });
    });

    describe("getTimeString", () => {
        it("应该格式化时间为 HH:mm 格式", () => {
            const date = new Date("2024-01-15T14:30:00");
            const timeString = getTimeString(date);

            expect(timeString).toMatch(/^\d{2}:\d{2}$/);
            expect(timeString).toBe("14:30");
        });

        it("应该正确处理单数小时和分钟", () => {
            const date = new Date("2024-01-15T09:05:00");
            const timeString = getTimeString(date);

            expect(timeString).toBe("09:05");
        });
    });

    describe("formatDateKey", () => {
        it("应该格式化为 YYYY-MM-DD 格式", () => {
            // 使用本地时间创建日期，避免时区问题
            const date = new Date(2024, 0, 15); // 2024年1月15日
            const dateKey = formatDateKey(date);

            expect(dateKey).toBe("2024-01-15");
        });

        it("应该正确处理单数月和日", () => {
            // 使用本地时间创建日期，避免时区问题
            const date = new Date(2024, 0, 5); // 2024年1月5日
            const dateKey = formatDateKey(date);

            expect(dateKey).toBe("2024-01-05");
        });
    });
});

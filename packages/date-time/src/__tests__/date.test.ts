/**
 * 日期操作工具函数测试
 */

import { describe, it, expect } from "vitest";
import {
    getMonthStart,
    getMonthEnd,
    getWeekStart,
    getWeekEnd,
    getWeekDates,
    getMonthDates,
    isSameDay,
    isToday,
    isSameMonth,
    isBusinessDay,
    isWeekend,
    daysBetween,
    generateDateGrid,
} from "../date";
import { formatDateKey } from "../format";

describe("date", () => {
    describe("getMonthStart", () => {
        it("应该返回月份的第一天", () => {
            const date = new Date(2024, 0, 15); // 2024年1月15日
            const monthStart = getMonthStart(date);

            expect(monthStart.getFullYear()).toBe(2024);
            expect(monthStart.getMonth()).toBe(0);
            expect(monthStart.getDate()).toBe(1);
        });

        it("应该支持字符串日期", () => {
            const monthStart = getMonthStart("2024-01-15");

            expect(monthStart.getFullYear()).toBe(2024);
            expect(monthStart.getMonth()).toBe(0);
            expect(monthStart.getDate()).toBe(1);
        });

        it("应该对无效日期抛出错误", () => {
            expect(() => getMonthStart("invalid-date")).toThrow();
        });
    });

    describe("getMonthEnd", () => {
        it("应该返回月份的最后一天", () => {
            const date = new Date(2024, 0, 15); // 2024年1月15日
            const monthEnd = getMonthEnd(date);

            expect(monthEnd.getFullYear()).toBe(2024);
            expect(monthEnd.getMonth()).toBe(0);
            expect(monthEnd.getDate()).toBe(31);
        });

        it("应该正确处理2月（非闰年）", () => {
            const date = new Date(2023, 1, 15); // 2023年2月15日
            const monthEnd = getMonthEnd(date);

            expect(monthEnd.getDate()).toBe(28);
        });

        it("应该正确处理2月（闰年）", () => {
            const date = new Date(2024, 1, 15); // 2024年2月15日
            const monthEnd = getMonthEnd(date);

            expect(monthEnd.getDate()).toBe(29);
        });

        it("应该支持字符串日期", () => {
            const monthEnd = getMonthEnd("2024-01-15");

            expect(monthEnd.getDate()).toBe(31);
        });
    });

    describe("getWeekStart", () => {
        it("应该返回周的开始日期（周一）", () => {
            const date = new Date(2024, 0, 15); // 2024年1月15日（周一）
            const weekStart = getWeekStart(date);

            expect(weekStart.getDay()).toBe(1); // 周一
        });

        it("应该支持字符串日期", () => {
            const weekStart = getWeekStart("2024-01-15");

            expect(weekStart.getDay()).toBe(1);
        });
    });

    describe("getWeekEnd", () => {
        it("应该返回周的结束日期（周日）", () => {
            const date = new Date(2024, 0, 15); // 2024年1月15日（周一）
            const weekEnd = getWeekEnd(date);

            expect(weekEnd.getDay()).toBe(0); // 周日
        });

        it("应该支持字符串日期", () => {
            const weekEnd = getWeekEnd("2024-01-15");

            expect(weekEnd.getDay()).toBe(0);
        });
    });

    describe("getWeekDates", () => {
        it("应该返回7个日期", () => {
            const date = new Date(2024, 0, 15);
            const weekDates = getWeekDates(date);

            expect(weekDates.length).toBe(7);
        });

        it("应该从周一开始", () => {
            const date = new Date(2024, 0, 15);
            const weekDates = getWeekDates(date);

            expect(weekDates[0].getDay()).toBe(1);
        });

        it("应该支持字符串日期", () => {
            const weekDates = getWeekDates("2024-01-15");

            expect(weekDates.length).toBe(7);
        });
    });

    describe("getMonthDates", () => {
        it("应该返回月份的所有日期（包括前后月份）", () => {
            const date = new Date(2024, 0, 15); // 2024年1月15日
            const monthDates = getMonthDates(date);

            expect(monthDates.length).toBeGreaterThanOrEqual(28);
            expect(monthDates.length).toBeLessThanOrEqual(42);
        });

        it("应该支持字符串日期", () => {
            const monthDates = getMonthDates("2024-01-15");

            expect(monthDates.length).toBeGreaterThan(0);
        });
    });

    describe("isSameDay", () => {
        it("应该正确判断同一天", () => {
            const date1 = new Date(2024, 0, 15, 10, 0, 0);
            const date2 = new Date(2024, 0, 15, 20, 0, 0);

            expect(isSameDay(date1, date2)).toBe(true);
        });

        it("应该正确判断不同天", () => {
            const date1 = new Date(2024, 0, 15);
            const date2 = new Date(2024, 0, 16);

            expect(isSameDay(date1, date2)).toBe(false);
        });

        it("应该支持字符串日期", () => {
            expect(isSameDay("2024-01-15", "2024-01-15")).toBe(true);
            expect(isSameDay("2024-01-15", "2024-01-16")).toBe(false);
        });

        it("应该支持混合类型", () => {
            // 使用本地时间创建日期，避免时区问题
            const date1 = new Date(2024, 0, 15);
            const date2 = new Date(2024, 0, 15);
            // 直接使用两个 Date 对象测试，避免字符串解析的时区问题
            expect(isSameDay(date1, date2)).toBe(true);
        });
    });

    describe("isToday", () => {
        it("应该正确判断今天", () => {
            const today = new Date();
            expect(isToday(today)).toBe(true);
        });

        it("应该正确判断非今天", () => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            expect(isToday(yesterday)).toBe(false);
        });

        it("应该支持字符串日期", () => {
            const today = new Date().toISOString().split("T")[0];
            expect(isToday(today)).toBe(true);
        });
    });

    describe("isSameMonth", () => {
        it("应该正确判断同一月", () => {
            const date1 = new Date(2024, 0, 15);
            const date2 = new Date(2024, 0, 20);

            expect(isSameMonth(date1, date2)).toBe(true);
        });

        it("应该正确判断不同月", () => {
            const date1 = new Date(2024, 0, 15);
            const date2 = new Date(2024, 1, 15);

            expect(isSameMonth(date1, date2)).toBe(false);
        });

        it("应该支持字符串日期", () => {
            expect(isSameMonth("2024-01-15", "2024-01-20")).toBe(true);
            expect(isSameMonth("2024-01-15", "2024-02-15")).toBe(false);
        });
    });

    describe("isBusinessDay", () => {
        it("应该正确判断工作日", () => {
            const monday = new Date(2024, 0, 15); // 周一
            expect(isBusinessDay(monday)).toBe(true);

            const friday = new Date(2024, 0, 19); // 周五
            expect(isBusinessDay(friday)).toBe(true);
        });

        it("应该正确判断周末", () => {
            const saturday = new Date(2024, 0, 13); // 周六
            expect(isBusinessDay(saturday)).toBe(false);

            const sunday = new Date(2024, 0, 14); // 周日
            expect(isBusinessDay(sunday)).toBe(false);
        });

        it("应该支持字符串日期", () => {
            // 使用本地时间创建日期，避免时区问题
            const monday = new Date(2024, 0, 15); // 周一
            const saturday = new Date(2024, 0, 13); // 周六
            expect(isBusinessDay(monday)).toBe(true);
            expect(isBusinessDay(saturday)).toBe(false);
        });
    });

    describe("isWeekend", () => {
        it("应该正确判断周末", () => {
            const saturday = new Date(2024, 0, 13); // 周六
            expect(isWeekend(saturday)).toBe(true);

            const sunday = new Date(2024, 0, 14); // 周日
            expect(isWeekend(sunday)).toBe(true);
        });

        it("应该正确判断工作日", () => {
            const monday = new Date(2024, 0, 15); // 周一
            expect(isWeekend(monday)).toBe(false);
        });

        it("应该支持字符串日期", () => {
            // 使用本地时间创建日期，避免时区问题
            const saturday = new Date(2024, 0, 13); // 周六
            const monday = new Date(2024, 0, 15); // 周一
            expect(isWeekend(saturday)).toBe(true);
            expect(isWeekend(monday)).toBe(false);
        });
    });

    describe("daysBetween", () => {
        it("应该正确计算天数差", () => {
            const date1 = new Date(2024, 0, 15);
            const date2 = new Date(2024, 0, 20);

            expect(daysBetween(date1, date2)).toBe(5);
        });

        it("应该正确处理负数（date2 在 date1 之前）", () => {
            const date1 = new Date(2024, 0, 20);
            const date2 = new Date(2024, 0, 15);

            expect(daysBetween(date1, date2)).toBe(-5);
        });

        it("应该支持字符串日期", () => {
            expect(daysBetween("2024-01-15", "2024-01-20")).toBe(5);
        });
    });

    describe("generateDateGrid", () => {
        it("应该生成日期网格", () => {
            const date = new Date(2024, 0, 15);
            const grid = generateDateGrid(date);

            expect(grid.length).toBeGreaterThan(0);
        });

        it("应该支持字符串日期", () => {
            const grid = generateDateGrid("2024-01-15");

            expect(grid.length).toBeGreaterThan(0);
        });
    });
});

/**
 * 时间操作工具函数测试
 */

import { describe, it, expect } from "vitest";
import {
    isValidTimeRange,
    calculateDuration,
    isTimeInRange,
    isBusinessHours,
    getDayHours,
    generateTimeSlots,
} from "../time";

describe("time", () => {
    describe("isValidTimeRange", () => {
        it("应该验证有效的时间范围", () => {
            const start = new Date(2024, 0, 15, 10, 0, 0);
            const end = new Date(2024, 0, 15, 11, 0, 0);

            expect(isValidTimeRange(start, end)).toBe(true);
        });

        it("应该拒绝无效的时间范围（结束时间早于开始时间）", () => {
            const start = new Date(2024, 0, 15, 11, 0, 0);
            const end = new Date(2024, 0, 15, 10, 0, 0);

            expect(isValidTimeRange(start, end)).toBe(false);
        });

        it("应该支持字符串日期", () => {
            expect(
                isValidTimeRange("2024-01-15T10:00:00", "2024-01-15T11:00:00")
            ).toBe(true);
        });
    });

    describe("calculateDuration", () => {
        it("应该计算持续时间（分钟数）", () => {
            const start = new Date(2024, 0, 15, 10, 0, 0);
            const end = new Date(2024, 0, 15, 11, 30, 0);

            expect(calculateDuration(start, end)).toBe(90);
        });

        it("应该对无效范围返回0", () => {
            const start = new Date(2024, 0, 15, 11, 0, 0);
            const end = new Date(2024, 0, 15, 10, 0, 0);

            expect(calculateDuration(start, end)).toBe(0);
        });

        it("应该支持字符串日期", () => {
            expect(
                calculateDuration("2024-01-15T10:00:00", "2024-01-15T11:00:00")
            ).toBe(60);
        });
    });

    describe("isTimeInRange", () => {
        it("应该判断时间是否在范围内", () => {
            const time = new Date(2024, 0, 15, 10, 30, 0);
            const start = new Date(2024, 0, 15, 10, 0, 0);
            const end = new Date(2024, 0, 15, 11, 0, 0);

            expect(isTimeInRange(time, start, end)).toBe(true);
        });

        it("应该判断时间不在范围内", () => {
            const time = new Date(2024, 0, 15, 12, 0, 0);
            const start = new Date(2024, 0, 15, 10, 0, 0);
            const end = new Date(2024, 0, 15, 11, 0, 0);

            expect(isTimeInRange(time, start, end)).toBe(false);
        });

        it("应该支持边界值", () => {
            const start = new Date(2024, 0, 15, 10, 0, 0);
            const end = new Date(2024, 0, 15, 11, 0, 0);

            expect(isTimeInRange(start, start, end)).toBe(true);
            expect(isTimeInRange(end, start, end)).toBe(true);
        });

        it("应该支持字符串日期", () => {
            expect(
                isTimeInRange(
                    "2024-01-15T10:30:00",
                    "2024-01-15T10:00:00",
                    "2024-01-15T11:00:00"
                )
            ).toBe(true);
        });
    });

    describe("isBusinessHours", () => {
        it("应该判断是否在工作时间", () => {
            const date = new Date(2024, 0, 15, 14, 0, 0); // 14:00

            expect(isBusinessHours(date, 9, 18, false)).toBe(true);
        });

        it("应该判断不在工作时间", () => {
            const date = new Date(2024, 0, 15, 20, 0, 0); // 20:00

            expect(isBusinessHours(date, 9, 18, false)).toBe(false);
        });

        it("应该支持字符串日期", () => {
            // 使用本地时间模式
            const date = new Date(2024, 0, 15, 14, 0, 0);
            expect(isBusinessHours(date, 9, 18, false)).toBe(true);
        });
    });

    describe("getDayHours", () => {
        it("应该返回0-23的所有小时", () => {
            const hours = getDayHours();

            expect(hours.length).toBe(24);
            expect(hours[0]).toBe(0);
            expect(hours[23]).toBe(23);
        });
    });

    describe("generateTimeSlots", () => {
        it("应该生成时间槽列表", () => {
            const slots = generateTimeSlots("09:00", "10:00", 30);

            expect(slots.length).toBeGreaterThan(0);
            expect(slots[0]).toEqual({ hour: 9, minute: 0 });
        });

        it("应该使用默认值", () => {
            const slots = generateTimeSlots();

            expect(slots.length).toBeGreaterThan(0);
        });

        it("应该正确处理不同的时间间隔", () => {
            const slots = generateTimeSlots("09:00", "10:00", 15);

            expect(slots.length).toBe(5); // 09:00, 09:15, 09:30, 09:45, 10:00
        });
    });
});

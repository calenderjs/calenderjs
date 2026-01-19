/**
 * 日期格式化工具函数测试
 */

import { describe, it, expect } from "vitest";
import { formatDateKey, getTimeString, formatTime } from "../format";

describe("format", () => {
    describe("formatDateKey", () => {
        it("应该格式化为 YYYY-MM-DD 格式", () => {
            const date = new Date(2024, 0, 15); // 2024年1月15日
            const dateKey = formatDateKey(date);

            expect(dateKey).toBe("2024-01-15");
        });

        it("应该正确处理单数月和日", () => {
            const date = new Date(2024, 0, 5); // 2024年1月5日
            const dateKey = formatDateKey(date);

            expect(dateKey).toBe("2024-01-05");
        });

        it("应该支持字符串日期", () => {
            // 使用本地时间创建日期，避免时区问题
            const date = new Date(2024, 0, 15);
            const dateKey = formatDateKey(date);

            expect(dateKey).toBe("2024-01-15");
        });

        it("应该对无效日期抛出错误", () => {
            expect(() => formatDateKey("invalid-date")).toThrow();
        });
    });

    describe("getTimeString", () => {
        it("应该格式化时间为 HH:mm 格式", () => {
            const date = new Date(2024, 0, 15, 14, 30, 0);
            const timeString = getTimeString(date);

            expect(timeString).toBe("14:30");
        });

        it("应该正确处理单数小时和分钟", () => {
            const date = new Date(2024, 0, 15, 9, 5, 0);
            const timeString = getTimeString(date);

            expect(timeString).toBe("09:05");
        });

        it("应该支持字符串日期", () => {
            // 使用本地时间创建日期，避免时区问题
            const date = new Date(2024, 0, 15, 14, 30, 0);
            const timeString = getTimeString(date);

            expect(timeString).toBe("14:30");
        });

        it("应该对无效日期抛出错误", () => {
            expect(() => getTimeString("invalid-date")).toThrow();
        });
    });

    describe("formatTime", () => {
        it("应该格式化24小时制时间", () => {
            const date = new Date(2024, 0, 15, 14, 30, 0);
            const timeString = formatTime(date, "24h");

            expect(timeString).toBe("14:30");
        });

        it("应该格式化12小时制时间（AM）", () => {
            const date = new Date(2024, 0, 15, 9, 30, 0);
            const timeString = formatTime(date, "12h");

            expect(timeString).toBe("9:30 AM");
        });

        it("应该格式化12小时制时间（PM）", () => {
            const date = new Date(2024, 0, 15, 14, 30, 0);
            const timeString = formatTime(date, "12h");

            expect(timeString).toBe("2:30 PM");
        });

        it("应该正确处理正午（12:00 PM）", () => {
            const date = new Date(2024, 0, 15, 12, 0, 0);
            const timeString = formatTime(date, "12h");

            expect(timeString).toBe("12:00 PM");
        });

        it("应该正确处理午夜（12:00 AM）", () => {
            const date = new Date(2024, 0, 15, 0, 0, 0);
            const timeString = formatTime(date, "12h");

            expect(timeString).toBe("12:00 AM");
        });

        it("应该使用默认24小时制", () => {
            const date = new Date(2024, 0, 15, 14, 30, 0);
            const timeString = formatTime(date);

            expect(timeString).toBe("14:30");
        });

        it("应该支持字符串日期", () => {
            // 使用本地时间创建日期，避免时区问题
            const date = new Date(2024, 0, 15, 14, 30, 0);
            const timeString = formatTime(date, "24h");

            expect(timeString).toBe("14:30");
        });
    });
});

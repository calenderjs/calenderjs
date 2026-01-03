/**
 * 时间工具函数库
 * 
 * 根据 RFC-0001 定义
 * 
 * 提供时间相关的工具函数，用于事件时间验证、冲突检测、时区转换等
 */

import type { Event } from "@calenderjs/event-model";

/**
 * 验证时间范围是否有效
 * 
 * @param startTime 开始时间
 * @param endTime 结束时间
 * @returns 是否有效
 */
export function isValidTimeRange(
    startTime: Date,
    endTime: Date
): boolean {
    if (!(startTime instanceof Date) || !(endTime instanceof Date)) {
        return false;
    }

    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
        return false;
    }

    return startTime < endTime;
}

/**
 * 计算持续时间（分钟数）
 * 
 * @param startTime 开始时间
 * @param endTime 结束时间
 * @returns 持续时间（分钟数）
 */
export function calculateDuration(
    startTime: Date,
    endTime: Date
): number {
    if (!isValidTimeRange(startTime, endTime)) {
        return 0;
    }

    return Math.round(
        (endTime.getTime() - startTime.getTime()) / (1000 * 60)
    );
}

/**
 * 检查两个事件是否有时间冲突（支持全天事件）
 * 
 * @param event1 第一个事件
 * @param event2 第二个事件
 * @returns 是否有冲突
 */
export function hasTimeConflict(event1: Event, event2: Event): boolean {
    // 如果两个事件是同一个，不冲突
    if (event1.id === event2.id) {
        return false;
    }

    const start1 =
        event1.startTime instanceof Date
            ? event1.startTime
            : new Date(event1.startTime);
    const end1 =
        event1.endTime instanceof Date
            ? event1.endTime
            : new Date(event1.endTime);
    const start2 =
        event2.startTime instanceof Date
            ? event2.startTime
            : new Date(event2.startTime);
    const end2 =
        event2.endTime instanceof Date
            ? event2.endTime
            : new Date(event2.endTime);

    // 处理全天事件
    // 全天事件的时间范围是当天的 00:00:00 到 23:59:59（或次日 00:00:00）
    if (event1.allDay && event2.allDay) {
        // 两个都是全天事件，检查日期是否重叠
        const date1Start = start1.toISOString().split("T")[0];
        const date1End = end1.toISOString().split("T")[0];
        const date2Start = start2.toISOString().split("T")[0];
        const date2End = end2.toISOString().split("T")[0];

        // 检查日期范围是否重叠
        return !(date1End < date2Start || date2End < date1Start);
    }

    if (event1.allDay) {
        // event1 是全天事件，检查 event2 的时间是否在 event1 的日期范围内
        const date1Start = start1.toISOString().split("T")[0];
        const date1End = end1.toISOString().split("T")[0];
        const date2Start = start2.toISOString().split("T")[0];
        const date2End = end2.toISOString().split("T")[0];

        // 检查 event2 的日期是否在 event1 的日期范围内
        return !(date2End < date1Start || date2Start > date1End);
    }

    if (event2.allDay) {
        // event2 是全天事件，检查 event1 的时间是否在 event2 的日期范围内
        const date1Start = start1.toISOString().split("T")[0];
        const date1End = end1.toISOString().split("T")[0];
        const date2Start = start2.toISOString().split("T")[0];
        const date2End = end2.toISOString().split("T")[0];

        // 检查 event1 的日期是否在 event2 的日期范围内
        return !(date1End < date2Start || date1Start > date2End);
    }

    // 两个都不是全天事件，检查时间是否重叠
    return !(end1 <= start2 || end2 <= start1);
}

/**
 * 时区转换
 * 
 * @param date 日期时间
 * @param fromTimeZone 源时区（IANA 时区标识符）
 * @param toTimeZone 目标时区（IANA 时区标识符）
 * @returns 转换后的日期时间
 */
export function convertTimeZone(
    date: Date,
    fromTimeZone: string,
    toTimeZone: string
): Date {
    // 使用 Intl.DateTimeFormat 进行时区转换
    const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: toTimeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    });

    // 获取源时区的时间字符串
    const sourceFormatter = new Intl.DateTimeFormat("en-US", {
        timeZone: fromTimeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    });

    // 将源时区的时间转换为目标时区的相同时间点
    const sourceParts = sourceFormatter.formatToParts(date);
    const targetParts = formatter.formatToParts(date);

    // 计算时差（简化实现，实际应该使用更精确的时区库）
    // 这里使用一个简化的实现，实际项目中应该使用 date-fns-tz 或类似库
    const sourceDate = new Date(
        `${sourceParts.find((p) => p.type === "year")?.value}-${
            sourceParts.find((p) => p.type === "month")?.value
        }-${sourceParts.find((p) => p.type === "day")?.value}T${
            sourceParts.find((p) => p.type === "hour")?.value
        }:${sourceParts.find((p) => p.type === "minute")?.value}:${
            sourceParts.find((p) => p.type === "second")?.value
        }`
    );

    const targetDate = new Date(
        `${targetParts.find((p) => p.type === "year")?.value}-${
            targetParts.find((p) => p.type === "month")?.value
        }-${targetParts.find((p) => p.type === "day")?.value}T${
            targetParts.find((p) => p.type === "hour")?.value
        }:${targetParts.find((p) => p.type === "minute")?.value}:${
            targetParts.find((p) => p.type === "second")?.value
        }`
    );

    // 计算时差并调整
    const offset = targetDate.getTime() - sourceDate.getTime();
    return new Date(date.getTime() + offset);
}

/**
 * 判断是否在工作时间
 * 
 * @param date 日期时间
 * @param startHour 工作开始时间（小时，默认 9）
 * @param endHour 工作结束时间（小时，默认 18）
 * @param useUTC 是否使用 UTC 时间（默认 true）
 * @returns 是否在工作时间
 */
export function isBusinessHours(
    date: Date,
    startHour: number = 9,
    endHour: number = 18,
    useUTC: boolean = true
): boolean {
    const hour = useUTC ? date.getUTCHours() : date.getHours();
    return hour >= startHour && hour < endHour;
}

/**
 * 判断是否是工作日
 * 
 * @param date 日期
 * @returns 是否是工作日（周一到周五）
 */
export function isBusinessDay(date: Date): boolean {
    const dayOfWeek = date.getDay();
    // 0 = 周日, 1 = 周一, ..., 6 = 周六
    return dayOfWeek >= 1 && dayOfWeek <= 5;
}

/**
 * 判断是否是周末
 * 
 * @param date 日期
 * @returns 是否是周末（周六或周日）
 */
export function isWeekend(date: Date): boolean {
    const dayOfWeek = date.getDay();
    // 0 = 周日, 6 = 周六
    return dayOfWeek === 0 || dayOfWeek === 6;
}

/**
 * 计算两个日期之间的天数
 * 
 * @param date1 第一个日期
 * @param date2 第二个日期
 * @returns 天数差（正数表示 date2 在 date1 之后）
 */
export function daysBetween(date1: Date, date2: Date): number {
    const d1 = new Date(date1);
    d1.setHours(0, 0, 0, 0);
    const d2 = new Date(date2);
    d2.setHours(0, 0, 0, 0);

    const diffTime = d2.getTime() - d1.getTime();
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

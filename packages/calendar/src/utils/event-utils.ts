/**
 * 事件工具函数
 */

import type { Event } from "@calenderjs/event-model";
import {
    isSameDay,
    formatDateKey,
    isTimeInRange,
} from "@calenderjs/date-time";

/**
 * 按日期分组事件
 */
export function groupEventsByDate(events: Event[]): Map<string, Event[]> {
    const grouped = new Map<string, Event[]>();

    for (const event of events) {
        const dateKey = formatDateKey(event.startTime);
        if (!grouped.has(dateKey)) {
            grouped.set(dateKey, []);
        }
        grouped.get(dateKey)!.push(event);
    }

    return grouped;
}

/**
 * 获取指定日期的事件
 */
export function getEventsForDate(
    events: Event[],
    date: Date | string
): Event[] {
    return events.filter((event) => {
        const eventDate =
            event.startTime instanceof Date
                ? event.startTime
                : new Date(event.startTime);
        return isSameDay(eventDate, date);
    });
}

/**
 * 获取指定日期范围内的事件
 */
export function getEventsInRange(
    events: Event[],
    startDate: Date | string,
    endDate: Date | string
): Event[] {
    const start = startDate instanceof Date ? startDate : new Date(startDate);
    const end = endDate instanceof Date ? endDate : new Date(endDate);
    return events.filter((event) => {
        const eventDate =
            event.startTime instanceof Date
                ? event.startTime
                : new Date(event.startTime);
        return eventDate >= start && eventDate <= end;
    });
}

/**
 * 按时间排序事件
 */
export function sortEventsByTime(events: Event[]): Event[] {
    return [...events].sort((a, b) => {
        const timeA = (
            a.startTime instanceof Date ? a.startTime : new Date(a.startTime)
        ).getTime();
        const timeB = (
            b.startTime instanceof Date ? b.startTime : new Date(b.startTime)
        ).getTime();
        if (timeA !== timeB) {
            return timeA - timeB;
        }
        // 如果开始时间相同，按结束时间排序
        const endTimeA = (
            a.endTime instanceof Date ? a.endTime : new Date(a.endTime)
        ).getTime();
        const endTimeB = (
            b.endTime instanceof Date ? b.endTime : new Date(b.endTime)
        ).getTime();
        return endTimeA - endTimeB;
    });
}

/**
 * 判断事件是否在时间范围内
 */
export function isEventInTimeRange(
    event: Event,
    startTime: Date,
    endTime: Date
): boolean {
    return (
        isTimeInRange(event.startTime, startTime, endTime) ||
        isTimeInRange(event.endTime, startTime, endTime) ||
        (event.startTime <= startTime && event.endTime >= endTime)
    );
}

/**
 * 计算事件在时间轴上的位置和高度（用于周视图和日视图）
 */
export function calculateEventPosition(
    event: Event,
    dayStart: Date | string,
    dayEnd: Date | string
): { top: number; height: number } {
    const eventStart =
        event.startTime instanceof Date
            ? event.startTime
            : new Date(event.startTime);
    const eventEnd =
        event.endTime instanceof Date ? event.endTime : new Date(event.endTime);
    const start = dayStart instanceof Date ? dayStart : new Date(dayStart);
    const end = dayEnd instanceof Date ? dayEnd : new Date(dayEnd);

    const dayStartMs = start.getTime();
    const dayEndMs = end.getTime();
    const dayDuration = dayEndMs - dayStartMs;

    const eventStartMs = Math.max(eventStart.getTime(), dayStartMs);
    const eventEndMs = Math.min(eventEnd.getTime(), dayEndMs);

    const top = ((eventStartMs - dayStartMs) / dayDuration) * 100;
    const height = ((eventEndMs - eventStartMs) / dayDuration) * 100;

    return { top, height };
}

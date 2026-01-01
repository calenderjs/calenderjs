/**
 * 事件工具函数
 */

import { Event } from "@calenderjs/core";
import { isSameDay, formatDateKey, isTimeInRange } from "./date-utils";

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
export function getEventsForDate(events: Event[], date: Date): Event[] {
    return events.filter((event) => isSameDay(event.startTime, date));
}

/**
 * 获取指定日期范围内的事件
 */
export function getEventsInRange(
    events: Event[],
    startDate: Date,
    endDate: Date
): Event[] {
    return events.filter((event) => {
        const eventDate = event.startTime;
        return eventDate >= startDate && eventDate <= endDate;
    });
}

/**
 * 按时间排序事件
 */
export function sortEventsByTime(events: Event[]): Event[] {
    return [...events].sort((a, b) => {
        const timeA = a.startTime.getTime();
        const timeB = b.startTime.getTime();
        if (timeA !== timeB) {
            return timeA - timeB;
        }
        // 如果开始时间相同，按结束时间排序
        return a.endTime.getTime() - b.endTime.getTime();
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
    dayStart: Date,
    dayEnd: Date
): { top: number; height: number } {
    const dayStartMs = dayStart.getTime();
    const dayEndMs = dayEnd.getTime();
    const dayDuration = dayEndMs - dayStartMs;
    
    const eventStartMs = Math.max(event.startTime.getTime(), dayStartMs);
    const eventEndMs = Math.min(event.endTime.getTime(), dayEndMs);
    
    const top = ((eventStartMs - dayStartMs) / dayDuration) * 100;
    const height = ((eventEndMs - eventStartMs) / dayDuration) * 100;
    
    return { top, height };
}

/**
 * 事件工具函数
 *
 * 注意：这些函数使用 Event 类型（来自 core），而不是 Appointment（来自 dsl）
 */

import type { Event } from "@calenderjs/event-model";
import { formatDateKey } from "@calenderjs/date-time";

/**
 * 判断事件是否在指定日期
 */
export function isAppointmentOnDate(appointment: Event, date: Date): boolean {
    const start = new Date(appointment.startTime);
    const end = new Date(appointment.endTime);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    const startDate = new Date(start);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(end);
    endDate.setHours(0, 0, 0, 0);

    return checkDate >= startDate && checkDate <= endDate;
}

/**
 * 判断事件是否在指定时间范围内
 */
export function isAppointmentInTimeRange(
    appointment: Event,
    startTime: Date,
    endTime: Date
): boolean {
    const aptStart = new Date(appointment.startTime);
    const aptEnd = new Date(appointment.endTime);

    return aptStart < endTime && aptEnd > startTime;
}

/**
 * 按日期分组事件
 */
export function groupAppointmentsByDate(
    appointments: Event[]
): Map<string, Event[]> {
    const grouped = new Map<string, Event[]>();

    appointments.forEach((appointment) => {
        const start = new Date(appointment.startTime);
        const end = new Date(appointment.endTime);
        const current = new Date(start);

        while (current <= end) {
            const dateKey = formatDateKey(current);
            if (!grouped.has(dateKey)) {
                grouped.set(dateKey, []);
            }
            grouped.get(dateKey)!.push(appointment);
            current.setDate(current.getDate() + 1);
        }
    });

    return grouped;
}

/**
 * 计算事件在时间轴上的位置（top，单位：px）
 */
export function calculateAppointmentTop(
    appointment: Event,
    slotHeight: number,
    slotDuration: number
): number {
    const start = new Date(appointment.startTime);
    const hours = start.getHours();
    const minutes = start.getMinutes();
    const totalMinutes = hours * 60 + minutes;
    const slots = totalMinutes / slotDuration;
    return slots * slotHeight;
}

/**
 * 计算事件的高度（单位：px）
 */
export function calculateAppointmentHeight(
    appointment: Event,
    slotHeight: number,
    slotDuration: number
): number {
    const start = new Date(appointment.startTime);
    const end = new Date(appointment.endTime);
    const duration = (end.getTime() - start.getTime()) / (1000 * 60); // 分钟
    const slots = duration / slotDuration;
    return slots * slotHeight;
}

/**
 * 预约工具函数
 */

import { Appointment } from '@calenderjs/dsl';
import { formatDateKey } from './date-utils';

/**
 * 判断预约是否在指定日期
 */
export function isAppointmentOnDate(appointment: Appointment, date: Date): boolean {
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
 * 判断预约是否在指定时间范围内
 */
export function isAppointmentInTimeRange(
  appointment: Appointment,
  startTime: Date,
  endTime: Date
): boolean {
  const aptStart = new Date(appointment.startTime);
  const aptEnd = new Date(appointment.endTime);

  return aptStart < endTime && aptEnd > startTime;
}

/**
 * 按日期分组预约
 */
export function groupAppointmentsByDate(
  appointments: Appointment[]
): Map<string, Appointment[]> {
  const grouped = new Map<string, Appointment[]>();

  appointments.forEach(appointment => {
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
 * 格式化日期键
 */
function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 计算预约在时间轴上的位置（top，单位：px）
 */
export function calculateAppointmentTop(
  appointment: Appointment,
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
 * 计算预约的高度（单位：px）
 */
export function calculateAppointmentHeight(
  appointment: Appointment,
  slotHeight: number,
  slotDuration: number
): number {
  const start = new Date(appointment.startTime);
  const end = new Date(appointment.endTime);
  const duration = (end.getTime() - start.getTime()) / (1000 * 60); // 分钟
  const slots = duration / slotDuration;
  return slots * slotHeight;
}

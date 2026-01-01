/**
 * 日期工具函数
 */

/**
 * 获取月份的第一天
 */
export function getMonthStart(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * 获取月份的最后一天
 */
export function getMonthEnd(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

/**
 * 获取周的开始日期（周一）
 */
export function getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // 调整为周一
    return new Date(d.setDate(diff));
}

/**
 * 获取周的结束日期（周日）
 */
export function getWeekEnd(date: Date): Date {
    const weekStart = getWeekStart(date);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    return weekEnd;
}

/**
 * 获取日期所在周的所有日期
 */
export function getWeekDates(date: Date): Date[] {
    const weekStart = getWeekStart(date);
    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + i);
        dates.push(d);
    }
    return dates;
}

/**
 * 获取月份的所有日期（包括前后月份的日期以填满网格）
 */
export function getMonthDates(date: Date): Date[] {
    const monthStart = getMonthStart(date);
    const monthEnd = getMonthEnd(date);
    const weekStart = getWeekStart(monthStart);
    const weekEnd = getWeekEnd(monthEnd);
    
    const dates: Date[] = [];
    const current = new Date(weekStart);
    
    while (current <= weekEnd) {
        dates.push(new Date(current));
        current.setDate(current.getDate() + 1);
    }
    
    return dates;
}

/**
 * 判断两个日期是否是同一天
 */
export function isSameDay(date1: Date, date2: Date): boolean {
    return (
        date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate()
    );
}

/**
 * 判断日期是否在同一个月
 */
export function isSameMonth(date1: Date, date2: Date): boolean {
    return (
        date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth()
    );
}

/**
 * 格式化日期为 YYYY-MM-DD
 */
export function formatDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * 获取日期的小时和分钟
 */
export function getTimeString(date: Date): string {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

/**
 * 判断时间是否在范围内
 */
export function isTimeInRange(
    time: Date,
    startTime: Date,
    endTime: Date
): boolean {
    const timeMs = time.getTime();
    const startMs = startTime.getTime();
    const endMs = endTime.getTime();
    return timeMs >= startMs && timeMs <= endMs;
}

/**
 * 获取一天的所有小时（0-23）
 */
export function getDayHours(): number[] {
    return Array.from({ length: 24 }, (_, i) => i);
}

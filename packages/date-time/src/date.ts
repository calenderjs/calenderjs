/**
 * 日期操作工具函数
 * 
 * 所有函数都支持 Date 对象和日期字符串（ISO 8601 格式）
 */

/**
 * 将输入转换为 Date 对象
 */
function toDate(date: Date | string): Date {
    if (date instanceof Date) {
        if (isNaN(date.getTime())) {
            throw new Error(`Invalid date: ${date}`);
        }
        return date;
    }
    if (typeof date === "string") {
        const d = new Date(date);
        if (isNaN(d.getTime())) {
            throw new Error(`Invalid date: ${date}`);
        }
        return d;
    }
    throw new Error(`Invalid date type: expected Date or string, got ${typeof date}`);
}

/**
 * 获取月份的第一天
 */
export function getMonthStart(date: Date | string): Date {
    const d = toDate(date);
    return new Date(d.getFullYear(), d.getMonth(), 1);
}

/**
 * 获取月份的最后一天
 */
export function getMonthEnd(date: Date | string): Date {
    const d = toDate(date);
    return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

/**
 * 获取周的开始日期
 * @param firstDayOfWeek 0 = 周日, 1 = 周一
 */
export function getWeekStart(date: Date | string, firstDayOfWeek: 0 | 1 = 1): Date {
    const d = toDate(date);
    const day = d.getDay();
    let diff: number;
    
    if (firstDayOfWeek === 0) {
        // 周日作为第一天
        diff = d.getDate() - day;
    } else {
        // 周一作为第一天
        diff = d.getDate() - day + (day === 0 ? -6 : 1);
    }
    
    const result = new Date(d);
    result.setDate(diff);
    result.setHours(0, 0, 0, 0);
    return result;
}

/**
 * 获取周的结束日期
 * @param firstDayOfWeek 0 = 周日, 1 = 周一
 */
export function getWeekEnd(date: Date | string, firstDayOfWeek: 0 | 1 = 1): Date {
    const weekStart = getWeekStart(date, firstDayOfWeek);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(0, 0, 0, 0);
    return weekEnd;
}

/**
 * 获取日期所在周的所有日期
 */
export function getWeekDates(date: Date | string, firstDayOfWeek: 0 | 1 = 1): Date[] {
    const weekStart = getWeekStart(date, firstDayOfWeek);
    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + i);
        d.setHours(0, 0, 0, 0); // 确保时间部分为 0，便于日期比较
        dates.push(d);
    }
    return dates;
}

/**
 * 获取月份的所有日期（包括前后月份的日期以填满网格）
 */
export function getMonthDates(date: Date | string, firstDayOfWeek: 0 | 1 = 1): Date[] {
    const monthStart = getMonthStart(date);
    const monthEnd = getMonthEnd(date);
    const weekStart = getWeekStart(monthStart, firstDayOfWeek);
    const weekEnd = getWeekEnd(monthEnd, firstDayOfWeek);

    const dates: Date[] = [];
    const current = new Date(weekStart);

    while (current <= weekEnd) {
        const dateCopy = new Date(current);
        dateCopy.setHours(0, 0, 0, 0); // 确保时间部分为 0，便于日期比较
        dates.push(dateCopy);
        current.setDate(current.getDate() + 1);
    }

    return dates;
}

/**
 * 判断两个日期是否是同一天
 */
export function isSameDay(date1: Date | string, date2: Date | string): boolean {
    const d1 = toDate(date1);
    const d2 = toDate(date2);
    return (
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate()
    );
}

/**
 * 判断是否是今天
 */
export function isToday(date: Date | string): boolean {
    return isSameDay(date, new Date());
}

/**
 * 判断日期是否在同一个月
 */
export function isSameMonth(date1: Date | string, date2: Date | string): boolean {
    const d1 = toDate(date1);
    const d2 = toDate(date2);
    return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth();
}

/**
 * 判断是否是工作日（周一到周五）
 */
export function isBusinessDay(date: Date | string): boolean {
    const d = toDate(date);
    const dayOfWeek = d.getDay();
    // 0 = 周日, 1 = 周一, ..., 6 = 周六
    return dayOfWeek >= 1 && dayOfWeek <= 5;
}

/**
 * 判断是否是周末（周六或周日）
 */
export function isWeekend(date: Date | string): boolean {
    const d = toDate(date);
    const dayOfWeek = d.getDay();
    // 0 = 周日, 6 = 周六
    return dayOfWeek === 0 || dayOfWeek === 6;
}

/**
 * 计算两个日期之间的天数
 */
export function daysBetween(date1: Date | string, date2: Date | string): number {
    const d1 = toDate(date1);
    const d2 = toDate(date2);
    d1.setHours(0, 0, 0, 0);
    d2.setHours(0, 0, 0, 0);

    const diffTime = d2.getTime() - d1.getTime();
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * 生成日期网格（用于月视图）
 */
export function generateDateGrid(
    date: Date | string,
    firstDayOfWeek: 0 | 1 = 1
): Date[] {
    return getMonthDates(date, firstDayOfWeek);
}

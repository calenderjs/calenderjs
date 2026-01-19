/**
 * 时间操作工具函数
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
 * 验证时间范围是否有效
 */
export function isValidTimeRange(
    startTime: Date | string,
    endTime: Date | string
): boolean {
    const start = toDate(startTime);
    const end = toDate(endTime);
    return start < end;
}

/**
 * 计算持续时间（分钟数）
 */
export function calculateDuration(
    startTime: Date | string,
    endTime: Date | string
): number {
    if (!isValidTimeRange(startTime, endTime)) {
        return 0;
    }

    const start = toDate(startTime);
    const end = toDate(endTime);
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
}

/**
 * 判断时间是否在范围内
 */
export function isTimeInRange(
    time: Date | string,
    startTime: Date | string,
    endTime: Date | string
): boolean {
    const t = toDate(time);
    const start = toDate(startTime);
    const end = toDate(endTime);
    const timeMs = t.getTime();
    const startMs = start.getTime();
    const endMs = end.getTime();
    return timeMs >= startMs && timeMs <= endMs;
}

/**
 * 判断是否在工作时间
 */
export function isBusinessHours(
    date: Date | string,
    startHour: number = 9,
    endHour: number = 18,
    useUTC: boolean = true
): boolean {
    const d = toDate(date);
    const hour = useUTC ? d.getUTCHours() : d.getHours();
    return hour >= startHour && hour < endHour;
}

/**
 * 获取一天的所有小时（0-23）
 */
export function getDayHours(): number[] {
    return Array.from({ length: 24 }, (_, i) => i);
}

/**
 * 生成时间槽列表
 */
export function generateTimeSlots(
    minTime: string = "00:00",
    maxTime: string = "23:59",
    slotDuration: number = 30
): Array<{ hour: number; minute: number }> {
    const [minHour, minMinute] = minTime.split(":").map(Number);
    const [maxHour, maxMinute] = maxTime.split(":").map(Number);

    const slots: Array<{ hour: number; minute: number }> = [];
    let currentHour = minHour;
    let currentMinute = minMinute;

    while (
        currentHour < maxHour ||
        (currentHour === maxHour && currentMinute <= maxMinute)
    ) {
        slots.push({ hour: currentHour, minute: currentMinute });

        currentMinute += slotDuration;
        if (currentMinute >= 60) {
            currentHour += Math.floor(currentMinute / 60);
            currentMinute = currentMinute % 60;
        }
    }

    return slots;
}

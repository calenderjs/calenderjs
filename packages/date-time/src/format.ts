/**
 * 日期格式化工具函数
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
 * 格式化日期为 YYYY-MM-DD
 */
export function formatDateKey(date: Date | string): string {
    const d = toDate(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

/**
 * 获取日期的小时和分钟（HH:mm 格式）
 */
export function getTimeString(date: Date | string): string {
    const d = toDate(date);
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
}

/**
 * 格式化时间
 */
export function formatTime(
    date: Date | string,
    format: "12h" | "24h" = "24h"
): string {
    const d = toDate(date);
    const hours = d.getHours();
    const minutes = d.getMinutes();

    if (format === "12h") {
        const period = hours >= 12 ? "PM" : "AM";
        const displayHours = hours % 12 || 12;
        return `${displayHours}:${String(minutes).padStart(2, "0")} ${period}`;
    }

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

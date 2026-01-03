/**
 * 重复事件生成工具
 * 
 * 根据 RFC-0001 定义
 * 
 * 用于从父事件和重复规则生成重复事件实例
 */

import type { Event, RecurringRule } from "@calenderjs/event-model";

/**
 * 生成重复事件实例
 * 
 * @param parentEvent 父事件（原始事件）
 * @param recurringRule 重复规则
 * @returns 生成的重复事件实例数组
 */
export function generateRecurringInstances(
    parentEvent: Event,
    recurringRule: RecurringRule
): Event[] {
    const instances: Event[] = [];
    const startTime =
        parentEvent.startTime instanceof Date
            ? parentEvent.startTime
            : new Date(parentEvent.startTime);
    const endTime =
        parentEvent.endTime instanceof Date
            ? parentEvent.endTime
            : new Date(parentEvent.endTime);

    // 计算持续时间（毫秒）
    const duration = endTime.getTime() - startTime.getTime();

    // 准备排除日期集合（用于快速查找）
    const excludeDateSet = new Set<string>();
    if (recurringRule.excludeDates) {
        recurringRule.excludeDates.forEach((date) => {
            const d = date instanceof Date ? date : new Date(date);
            const dateStr = d.toISOString().split("T")[0]; // YYYY-MM-DD
            excludeDateSet.add(dateStr);
        });
    }

    // 确定结束条件
    const hasEndDate = !!recurringRule.endDate;
    const hasCount = recurringRule.count !== undefined && recurringRule.count > 0;
    const endDate = hasEndDate && recurringRule.endDate
        ? recurringRule.endDate instanceof Date
            ? recurringRule.endDate
            : new Date(recurringRule.endDate)
        : null;
    const maxCount = hasCount ? recurringRule.count! : Infinity;

    let currentDate = new Date(startTime);
    let instanceCount = 0;

    // 根据频率生成实例
    switch (recurringRule.frequency) {
        case "daily":
            instanceCount = generateDailyInstances(
                instances,
                parentEvent,
                currentDate,
                duration,
                recurringRule.interval,
                endDate,
                maxCount,
                excludeDateSet
            );
            break;

        case "weekly":
            if (!recurringRule.daysOfWeek || recurringRule.daysOfWeek.length === 0) {
                throw new Error("weekly 频率必须设置 daysOfWeek");
            }
            instanceCount = generateWeeklyInstances(
                instances,
                parentEvent,
                currentDate,
                duration,
                recurringRule.interval,
                recurringRule.daysOfWeek,
                endDate,
                maxCount,
                excludeDateSet
            );
            break;

        case "monthly":
            instanceCount = generateMonthlyInstances(
                instances,
                parentEvent,
                currentDate,
                duration,
                recurringRule.interval,
                recurringRule.dayOfMonth,
                endDate,
                maxCount,
                excludeDateSet
            );
            break;

        case "yearly":
            instanceCount = generateYearlyInstances(
                instances,
                parentEvent,
                currentDate,
                duration,
                recurringRule.interval,
                endDate,
                maxCount,
                excludeDateSet
            );
            break;

        default:
            throw new Error(`不支持的重复频率: ${recurringRule.frequency}`);
    }

    return instances;
}

/**
 * 生成 daily 重复实例
 */
function generateDailyInstances(
    instances: Event[],
    parentEvent: Event,
    startDate: Date,
    duration: number,
    interval: number,
    endDate: Date | null,
    maxCount: number,
    excludeDateSet: Set<string>
): number {
    let currentDate = new Date(startDate);
    let count = 0;
    let dayOffset = 0;

    while (count < maxCount) {
        // 检查是否超过结束日期
        if (endDate && currentDate > endDate) {
            break;
        }

        // 检查是否在排除日期列表中
        const dateStr = currentDate.toISOString().split("T")[0];
        if (!excludeDateSet.has(dateStr)) {
            const instance = createRecurringInstance(
                parentEvent,
                currentDate,
                duration,
                count
            );
            instances.push(instance);
            count++;
        }

        // 移动到下一个日期（间隔天数）
        dayOffset += interval;
        currentDate = new Date(startDate);
        currentDate.setUTCDate(currentDate.getUTCDate() + dayOffset);
    }

    return count;
}

/**
 * 生成 weekly 重复实例
 */
function generateWeeklyInstances(
    instances: Event[],
    parentEvent: Event,
    startDate: Date,
    duration: number,
    interval: number,
    daysOfWeek: number[],
    endDate: Date | null,
    maxCount: number,
    excludeDateSet: Set<string>
): number {
    let currentDate = new Date(startDate);
    let count = 0;
    let weekOffset = 0;

    // 找到第一个匹配的日期
    const startDayOfWeek = currentDate.getUTCDay();
    const sortedDaysOfWeek = [...daysOfWeek].sort((a, b) => a - b);

    // 找到第一个大于等于当前星期几的目标日期
    let nextDayIndex = sortedDaysOfWeek.findIndex((day) => day >= startDayOfWeek);
    if (nextDayIndex === -1) {
        // 如果当前星期几大于所有目标日期，则从下一周开始
        nextDayIndex = 0;
        weekOffset = interval;
    } else if (sortedDaysOfWeek[nextDayIndex] === startDayOfWeek) {
        // 如果当前日期就是目标日期之一，包含它
        // nextDayIndex 已经正确设置
    }

    while (count < maxCount) {
        // 在当前周内查找匹配的日期
        for (let i = nextDayIndex; i < sortedDaysOfWeek.length && count < maxCount; i++) {
            const targetDay = sortedDaysOfWeek[i];
            const targetDate = new Date(startDate);
            targetDate.setUTCDate(
                startDate.getUTCDate() +
                    weekOffset * 7 +
                    (targetDay - startDayOfWeek + 7) % 7
            );

            // 检查是否超过结束日期
            if (endDate && targetDate > endDate) {
                return count;
            }

            // 检查是否在排除日期列表中
            const dateStr = targetDate.toISOString().split("T")[0];
            if (!excludeDateSet.has(dateStr)) {
                const instance = createRecurringInstance(
                    parentEvent,
                    targetDate,
                    duration,
                    count
                );
                instances.push(instance);
                count++;
            }
        }

        // 移动到下一周
        weekOffset += interval;
        nextDayIndex = 0; // 从下一周的第一天开始
    }

    return count;
}

/**
 * 生成 monthly 重复实例
 */
function generateMonthlyInstances(
    instances: Event[],
    parentEvent: Event,
    startDate: Date,
    duration: number,
    interval: number,
    dayOfMonth: number | undefined,
    endDate: Date | null,
    maxCount: number,
    excludeDateSet: Set<string>
): number {
    let currentDate = new Date(startDate);
    let count = 0;
    let monthOffset = 0;

    // 如果指定了 dayOfMonth，使用它；否则使用原始日期的日期
    const targetDay = dayOfMonth ?? currentDate.getUTCDate();

    while (count < maxCount) {
        const targetDate = new Date(startDate);
        targetDate.setUTCFullYear(startDate.getUTCFullYear());
        targetDate.setUTCMonth(startDate.getUTCMonth() + monthOffset);
        
        // 处理月份天数不足的情况（如 2 月 31 日）
        const daysInMonth = new Date(
            targetDate.getUTCFullYear(),
            targetDate.getUTCMonth() + 1,
            0
        ).getUTCDate();
        const actualDay = Math.min(targetDay, daysInMonth);
        targetDate.setUTCDate(actualDay);

        // 保持原始时间
        targetDate.setUTCHours(startDate.getUTCHours());
        targetDate.setUTCMinutes(startDate.getUTCMinutes());
        targetDate.setUTCSeconds(startDate.getUTCSeconds());
        targetDate.setUTCMilliseconds(startDate.getUTCMilliseconds());

        // 检查是否超过结束日期
        if (endDate && targetDate > endDate) {
            break;
        }

        // 检查是否在排除日期列表中
        const dateStr = targetDate.toISOString().split("T")[0];
        if (!excludeDateSet.has(dateStr)) {
            const instance = createRecurringInstance(
                parentEvent,
                targetDate,
                duration,
                count
            );
            instances.push(instance);
            count++;
        }

        // 移动到下一个月
        monthOffset += interval;
    }

    return count;
}

/**
 * 生成 yearly 重复实例
 */
function generateYearlyInstances(
    instances: Event[],
    parentEvent: Event,
    startDate: Date,
    duration: number,
    interval: number,
    endDate: Date | null,
    maxCount: number,
    excludeDateSet: Set<string>
): number {
    let currentDate = new Date(startDate);
    let count = 0;
    let yearOffset = 0;

    while (count < maxCount) {
        const targetDate = new Date(startDate);
        targetDate.setUTCFullYear(startDate.getUTCFullYear() + yearOffset);

        // 检查是否超过结束日期
        if (endDate && targetDate > endDate) {
            break;
        }

        // 检查是否在排除日期列表中
        const dateStr = targetDate.toISOString().split("T")[0];
        if (!excludeDateSet.has(dateStr)) {
            const instance = createRecurringInstance(
                parentEvent,
                targetDate,
                duration,
                count
            );
            instances.push(instance);
            count++;
        }

        // 移动到下一年
        yearOffset += interval;
    }

    return count;
}

/**
 * 创建重复事件实例
 */
function createRecurringInstance(
    parentEvent: Event,
    startDate: Date,
    duration: number,
    instanceIndex: number
): Event {
    const endDate = new Date(startDate.getTime() + duration);

    // 生成实例 ID（使用父事件 ID + 索引）
    const instanceId = `${parentEvent.id}-${instanceIndex + 1}`;

    // 创建实例事件
    const instance: Event = {
        ...parentEvent,
        id: instanceId,
        startTime: new Date(startDate),
        endTime: new Date(endDate),
        parentEventId: parentEvent.id,
        recurrenceId: instanceId,
        // 移除 recurring 规则（实例不需要）
        recurring: undefined,
    };

    return instance;
}

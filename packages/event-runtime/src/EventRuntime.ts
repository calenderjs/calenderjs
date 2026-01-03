/**
 * Event 运行时引擎
 *
 * 根据 RFC-0001 定义
 *
 * **架构说明**：
 *
 * 1. **Event Data Model**（`@calenderjs/event-model`）：
 *    - 定义 Event 接口结构和 JSON Schema
 *    - 验证从 DSL 生成的 Event 数据（输出验证），而不是验证 DSL
 *    - 使用 EventValidator 验证 Event 结构是否符合 JSON Schema
 *
 * 2. **Calendar 组件**（`@calenderjs/calendar`）：
 *    - 直接使用 Event 数据渲染（start, end, timezone, title, description, extra 等）
 *    - 不需要运行时，直接使用 Event 对象
 *
 * 3. **运行时验证**（EventRuntime，在 `@calenderjs/event-dsl` 包中）：
 *    - **角色**：验证用户手动创建/编辑的 Event 数据是否符合 DSL 定义的业务规则
 *    - **使用场景**：应用层，当用户通过表单输入 Event 数据时
 *    - **需要 AST**：是的，需要保留 AST 用于运行时验证
 *      - AST 包含 DSL 中定义的验证规则（`validate:` 部分）
 *      - 运行时使用 AST 中的验证规则验证 Event 数据
 *
 * **正确的架构**：
 * 1. **DSL 编译成 Data Model**：
 *    - DSL → EventDSLCompiler → 编译成 Data Model（JSON Schema for Event.extra + 业务规则）
 *    - Data Model 包含：
 *      - JSON Schema（用于 EventValidator 验证结构）
 *      - 业务规则（用于 EventRuntime 验证业务逻辑）
 *
 * 2. **JSON Schema 验证**（EventValidator，使用编译后的 Data Model）：
 *    - Event 对象 → EventValidator（使用编译后的 JSON Schema）→ 验证结构
 *
 * 4. **运行时验证**（EventRuntime，使用编译后的 Data Model）：
 *    - 用户输入 Event 数据 → EventRuntime（使用编译后的业务规则）→ 验证业务规则
 *    - 例如：验证 `attendees.count between 1 and 50`（需要运行时数据）
 *
 * **重要**：
 * - DSL **必须编译成 Data Model**（JSON Schema + 业务规则）
 * - 运行时**使用编译后的 Data Model**，而不是直接使用 AST
 * - Event Data Model 应该包含编译后的 JSON Schema 和业务规则
 * - 运行时在 `@calenderjs/event-runtime` 包中，依赖 `@calenderjs/event-dsl` 获取 AST 类型
 */

import type {
    ValidationResult,
    RenderedEvent,
    EventTypeDataModel,
} from "@calenderjs/event-model";
import type { Event } from "@calenderjs/event-model";
import type { ValidationContext, RenderContext, User } from "@calenderjs/core";

/**
 * Event 运行时引擎
 *
 * **用途**：执行 DSL AST，进行业务规则验证、渲染和行为检查
 *
 * **验证职责**：
 * - 编译时验证（EventDSLCompiler，在 DSL 包中）：验证 DSL 语法，生成验证器函数
 * - JSON Schema 验证（EventValidator，在数据模型包中）：验证 Event 结构
 * - 运行时验证（EventRuntime，在 DSL 包中）：执行业务规则（如 `attendees.count between 1 and 50`）
 *
 * **重要**：
 * - 运行时在 `@calenderjs/event-runtime` 包中，依赖 `@calenderjs/event-dsl` 获取 AST 类型
 * - 但运行时验证的是 Event 数据模型的数据
 *
 * **注意**：Calendar 组件不需要运行时，直接使用 Event 对象。
 * 运行时主要用于应用层的业务规则验证和权限检查。
 */
export class EventRuntime {
    private dataModel: EventTypeDataModel;

    constructor(dataModel: EventTypeDataModel) {
        this.dataModel = dataModel;
    }

    /**
     * 获取 Data Model（只读）
     */
    getDataModel(): EventTypeDataModel {
        return this.dataModel;
    }

    /**
     * 验证事件
     *
     * **验证流程**：
     * 1. DSL 文本定义验证规则（在 `validate:` 部分）
     * 2. DSL 解析器将验证规则解析为 AST（`this.ast.validate: ValidationRule[]`）
     * 3. 运行时**使用** AST 中的验证规则，**验证** Event 数据模型的数据
     *    - 使用：`this.ast.validate`（AST 中的验证规则）
     *    - 验证：`event: Event`（Event 数据模型的数据，来自 @calenderjs/event-model）
     *
     * **验证内容**（基于 DSL 中定义的验证规则，业务规则，需要运行时数据）：
     * 1. **Between 规则**：字段值在范围内
     *    - DSL：`attendees.count between 1 and 50`
     *    - 验证：`event.extra.attendees.length` 是否在 1-50 之间
     *
     * 2. **Comparison 规则**：比较表达式
     *    - DSL：`startTime.hour >= 9`、`duration < 2 hours`
     *    - 验证：字段值与常量或表达式的比较
     *
     * 3. **NoConflict 规则**：检查时间冲突
     *    - DSL：`no conflict with other events`
     *    - 验证：事件时间是否与其他事件冲突（需要 context.events）
     *
     * 4. **Conflict 规则**：检查是否有冲突（与 NoConflict 相反）
     *    - DSL：`conflict with other events`
     *    - 验证：事件时间是否与其他事件冲突
     *
     * 5. **When 规则**：条件满足时执行子规则
     *    - DSL：`when priority is high: attendees.count >= 5`
     *    - 验证：条件满足时执行子规则验证
     *
     * **重要**：
     * - 运行时**使用** AST 中的验证规则（`this.ast.validate`）
     * - 运行时**验证** Event 数据模型的数据（`event: Event`，来自 @calenderjs/event-model）
     * - 这些验证需要运行时数据（event.extra.attendees.length）
     * - 这些验证需要上下文信息（context.events, context.now, context.user）
     * - 这些验证无法在编译时验证（数据是动态的）
     * - 这些验证无法通过 JSON Schema 验证（JSON Schema 只能验证结构）
     *
     * @param event 要验证的 Event 对象（来自 @calenderjs/event-model，Event 数据模型）
     * @param context 验证上下文（包含 events, now, user 等信息）
     * @returns 验证结果
     */
    validate(event: Event, context: ValidationContext): ValidationResult {
        const errors: string[] = [];

        // 1. 基础时间验证（自动应用，不依赖 DSL 规则）
        const baseTimeErrors = this.validateBaseTimeRules(event, context);
        if (baseTimeErrors.length > 0) {
            errors.push(...baseTimeErrors);
        }

        // 2. 使用 Data Model 中的验证规则，验证 Event 数据模型的数据
        const validationRules = this.dataModel.validationRules || [];
        for (const rule of validationRules) {
            const result = this.evaluateValidationRule(rule, event, context);
            if (!result.valid) {
                errors.push(...(result.errors || []));
            }
        }

        return {
            valid: errors.length === 0,
            errors: errors.length > 0 ? errors : undefined,
        };
    }

    /**
     * 验证基础时间规则（自动应用）
     *
     * 这些规则基于 constraints 中的约束值自动验证
     */
    private validateBaseTimeRules(
        event: Event,
        context: ValidationContext
    ): string[] {
        const errors: string[] = [];
        const constraints = this.dataModel.constraints || [];

        // 获取约束值
        const getConstraint = (name: string): any => {
            const constraint = constraints.find((c) => c.name === name);
            return constraint?.value;
        };

        // 1. startTime before endTime（自动验证）
        const startTime =
            event.startTime instanceof Date
                ? event.startTime
                : new Date(event.startTime);
        const endTime =
            event.endTime instanceof Date
                ? event.endTime
                : new Date(event.endTime);

        if (startTime >= endTime) {
            errors.push("开始时间必须早于结束时间");
        }

        // 2. duration >= minDuration
        const minDuration = getConstraint("minDuration");
        if (minDuration) {
            const minMinutes = this.durationToMinutes(minDuration);
            const duration = this.getFieldValue(
                { type: "FieldAccess", path: ["duration"] },
                event,
                context
            );
            if (duration !== undefined && duration < minMinutes) {
                errors.push(
                    `持续时间必须至少 ${this.formatDuration(minMinutes)}`
                );
            }
        }

        // 3. duration <= maxDuration
        const maxDuration = getConstraint("maxDuration");
        if (maxDuration) {
            const maxMinutes = this.durationToMinutes(maxDuration);
            const duration = this.getFieldValue(
                { type: "FieldAccess", path: ["duration"] },
                event,
                context
            );
            if (duration !== undefined && duration > maxMinutes) {
                errors.push(
                    `持续时间不能超过 ${this.formatDuration(maxMinutes)}`
                );
            }
        }

        // 4. 时间精度验证（startTime.minute mod timePrecision is 0）
        const timePrecision = getConstraint("timePrecision");
        if (timePrecision) {
            const precisionMinutes = this.durationToMinutes(timePrecision);
            const startMinutes = startTime.getUTCMinutes();
            if (startMinutes % precisionMinutes !== 0) {
                errors.push(
                    `开始时间的分钟数必须是 ${precisionMinutes} 的倍数`
                );
            }
            const endMinutes = endTime.getUTCMinutes();
            if (endMinutes % precisionMinutes !== 0) {
                errors.push(
                    `结束时间的分钟数必须是 ${precisionMinutes} 的倍数`
                );
            }
        }

        // 5. 提前创建时间验证（startTime after now plus minAdvanceTime）
        const minAdvanceTime = getConstraint("minAdvanceTime");
        if (minAdvanceTime && context.now) {
            const advanceMinutes = this.durationToMinutes(minAdvanceTime);
            const now =
                context.now instanceof Date
                    ? context.now
                    : new Date(context.now);
            const minStartTime = new Date(
                now.getTime() + advanceMinutes * 60 * 1000
            );
            if (startTime < minStartTime) {
                errors.push(
                    `开始时间必须至少提前 ${this.formatDuration(
                        advanceMinutes
                    )} 创建`
                );
            }
        }

        // 6. 最多提前创建时间验证（startTime before now plus maxAdvanceTime）
        const maxAdvanceTime = getConstraint("maxAdvanceTime");
        if (maxAdvanceTime && context.now) {
            const advanceMinutes = this.durationToMinutes(maxAdvanceTime);
            const now =
                context.now instanceof Date
                    ? context.now
                    : new Date(context.now);
            const maxStartTime = new Date(
                now.getTime() + advanceMinutes * 60 * 1000
            );
            if (startTime > maxStartTime) {
                errors.push(
                    `开始时间不能超过 ${this.formatDuration(
                        advanceMinutes
                    )} 后创建`
                );
            }
        }

        // 7. 时区验证（event.timeZone equals timeZone）
        const timeZone = getConstraint("timeZone");
        if (timeZone && event.timeZone && event.timeZone !== timeZone) {
            errors.push(`事件时区必须是 ${timeZone}`);
        }

        // 8. 允许的时区列表验证
        const allowedTimeZones = getConstraint("allowedTimeZones");
        if (
            allowedTimeZones &&
            Array.isArray(allowedTimeZones) &&
            event.timeZone
        ) {
            if (!allowedTimeZones.includes(event.timeZone)) {
                errors.push(
                    `事件时区必须是以下之一: ${allowedTimeZones.join(", ")}`
                );
            }
        }

        // 9. 全天事件验证
        if (event.allDay === true) {
            // 验证全天事件的 startTime 和 endTime 格式
            // 全天事件的开始时间应该是当天的 00:00:00
            const startHour = startTime.getUTCHours();
            const startMinute = startTime.getUTCMinutes();
            const startSecond = startTime.getUTCSeconds();
            const startMillisecond = startTime.getUTCMilliseconds();

            if (
                startHour !== 0 ||
                startMinute !== 0 ||
                startSecond !== 0 ||
                startMillisecond !== 0
            ) {
                errors.push("全天事件的开始时间应该是当天的 00:00:00");
            }

            // 验证全天事件的结束时间应该是当天的 23:59:59 或次日的 00:00:00
            const endHour = endTime.getUTCHours();
            const endMinute = endTime.getUTCMinutes();
            const endSecond = endTime.getUTCSeconds();
            const endMillisecond = endTime.getUTCMilliseconds();

            const isEndOfDay =
                (endHour === 23 && endMinute === 59 && endSecond === 59) ||
                (endHour === 0 &&
                    endMinute === 0 &&
                    endSecond === 0 &&
                    endMillisecond === 0);

            if (!isEndOfDay) {
                // 检查是否是跨天（结束日期是次日）
                const startDate = startTime.toISOString().split("T")[0];
                const endDate = endTime.toISOString().split("T")[0];
                const isNextDay =
                    endDate !== startDate &&
                    endHour === 0 &&
                    endMinute === 0 &&
                    endSecond === 0 &&
                    endMillisecond === 0;

                if (!isNextDay) {
                    errors.push(
                        "全天事件的结束时间应该是当天的 23:59:59 或次日的 00:00:00"
                    );
                }
            }
        } else {
            // 非全天事件的跨天验证
            const allowCrossDay = getConstraint("allowCrossDay");
            if (allowCrossDay === false) {
                // 如果不允许跨天且不是全天事件，检查是否跨天
                const startDate = startTime.toISOString().split("T")[0];
                const endDate = endTime.toISOString().split("T")[0];
                if (startDate !== endDate) {
                    errors.push("不允许跨天事件");
                }
            }
        }

        // 10. 最大跨天时长验证
        const maxCrossDayDuration = getConstraint("maxCrossDayDuration");
        if (maxCrossDayDuration) {
            const maxDays = this.durationToDays(maxCrossDayDuration);
            const startDate = new Date(startTime.toISOString().split("T")[0]);
            const endDate = new Date(endTime.toISOString().split("T")[0]);
            const daysDiff = Math.ceil(
                (endDate.getTime() - startDate.getTime()) /
                    (1000 * 60 * 60 * 24)
            );
            if (daysDiff > maxDays) {
                errors.push(`跨天时长不能超过 ${maxDays} 天`);
            }
        }

        // 11. 重复事件验证
        const recurringErrors = this.validateRecurringRules(event, context);
        if (recurringErrors.length > 0) {
            errors.push(...recurringErrors);
        }

        return errors;
    }

    /**
     * 验证重复事件规则
     */
    private validateRecurringRules(
        event: Event,
        context: ValidationContext
    ): string[] {
        const errors: string[] = [];

        // 如果事件没有设置重复规则，跳过验证
        if (!event.recurring) {
            return errors;
        }

        const recurring = event.recurring;
        const startTime =
            event.startTime instanceof Date
                ? event.startTime
                : new Date(event.startTime);

        // 1. 验证 endDate after startTime or count > 0
        if (!recurring.endDate && (!recurring.count || recurring.count <= 0)) {
            errors.push("重复事件必须设置 endDate 或 count > 0");
        }

        // 验证 endDate 必须在 startTime 之后
        if (recurring.endDate) {
            const endDate =
                recurring.endDate instanceof Date
                    ? recurring.endDate
                    : new Date(recurring.endDate);
            if (endDate <= startTime) {
                errors.push("重复事件的结束日期必须晚于开始时间");
            }
        }

        // 2. 验证 weekly 频率需要 daysOfWeek
        if (recurring.frequency === "weekly") {
            if (
                !recurring.daysOfWeek ||
                !Array.isArray(recurring.daysOfWeek) ||
                recurring.daysOfWeek.length === 0
            ) {
                errors.push("weekly 频率的重复事件必须设置 daysOfWeek");
            } else {
                // 验证 daysOfWeek 值在 0-6 范围内
                const invalidDays = recurring.daysOfWeek.filter(
                    (day) => day < 0 || day > 6
                );
                if (invalidDays.length > 0) {
                    errors.push(
                        `daysOfWeek 值必须在 0-6 之间（0=周日，6=周六），无效值: ${invalidDays.join(
                            ", "
                        )}`
                    );
                }
            }
        }

        // 3. 验证 monthly 频率需要 dayOfMonth between 1 and 31
        if (recurring.frequency === "monthly") {
            if (
                recurring.dayOfMonth === undefined ||
                recurring.dayOfMonth === null
            ) {
                errors.push("monthly 频率的重复事件必须设置 dayOfMonth");
            } else if (recurring.dayOfMonth < 1 || recurring.dayOfMonth > 31) {
                errors.push("dayOfMonth 必须在 1-31 之间");
            }
        }

        // 4. 验证 yearly 频率规则（目前没有特殊要求，但可以添加）
        if (recurring.frequency === "yearly") {
            // yearly 频率通常不需要额外的必填字段
            // 但可以验证 dayOfMonth 是否在有效范围内（如果设置了）
            if (
                recurring.dayOfMonth !== undefined &&
                recurring.dayOfMonth !== null
            ) {
                if (recurring.dayOfMonth < 1 || recurring.dayOfMonth > 31) {
                    errors.push("dayOfMonth 必须在 1-31 之间");
                }
            }
        }

        // 5. 验证 interval 必须大于 0
        if (recurring.interval === undefined || recurring.interval <= 0) {
            errors.push("重复事件的 interval 必须大于 0");
        }

        // 6. 验证 count 必须大于 0（如果设置了）
        if (recurring.count !== undefined && recurring.count <= 0) {
            errors.push("重复事件的 count 必须大于 0");
        }

        // 7. 验证 excludeDates 格式（如果设置了）
        if (recurring.excludeDates && Array.isArray(recurring.excludeDates)) {
            const invalidDates = recurring.excludeDates.filter((date) => {
                const d = date instanceof Date ? date : new Date(date);
                return isNaN(d.getTime());
            });
            if (invalidDates.length > 0) {
                errors.push(
                    `excludeDates 包含无效的日期格式: ${invalidDates.length} 个`
                );
            }
        }

        return errors;
    }

    /**
     * 将 Duration 转换为分钟数
     */
    private durationToMinutes(duration: any): number {
        if (typeof duration === "number") {
            return duration;
        }
        if (duration?.type === "Duration") {
            const value = duration.value;
            const unit = duration.unit;
            switch (unit) {
                case "minutes":
                    return value;
                case "hours":
                    return value * 60;
                case "days":
                    return value * 24 * 60;
                case "weeks":
                    return value * 7 * 24 * 60;
                default:
                    return value;
            }
        }
        return 0;
    }

    /**
     * 将 Duration 转换为天数
     */
    private durationToDays(duration: any): number {
        if (typeof duration === "number") {
            return duration;
        }
        if (duration?.type === "Duration") {
            const value = duration.value;
            const unit = duration.unit;
            switch (unit) {
                case "days":
                    return value;
                case "weeks":
                    return value * 7;
                case "hours":
                    return value / 24;
                case "minutes":
                    return value / (24 * 60);
                default:
                    return value;
            }
        }
        return 0;
    }

    /**
     * 格式化持续时间为可读字符串
     */
    private formatDuration(minutes: number): string {
        if (minutes < 60) {
            return `${minutes} 分钟`;
        } else if (minutes < 24 * 60) {
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            return mins > 0 ? `${hours} 小时 ${mins} 分钟` : `${hours} 小时`;
        } else {
            const days = Math.floor(minutes / (24 * 60));
            const hours = Math.floor((minutes % (24 * 60)) / 60);
            return hours > 0 ? `${days} 天 ${hours} 小时` : `${days} 天`;
        }
    }

    /**
     * 渲染事件
     */
    render(event: Event, context: RenderContext): RenderedEvent {
        const rendered: RenderedEvent = {
            title: event.title,
            color: "#4285f4",
            description: "",
        };

        // 执行显示规则
        const displayRules = this.dataModel.displayRules || [];
        for (const rule of displayRules) {
            const value = this.evaluateDisplayValue(rule.value, event, context);
            switch (rule.name) {
                case "color":
                    rendered.color = typeof value === "string" ? value : String(value);
                    break;
                case "icon":
                    // icon 可以是字符串或其他类型（如对象），保持原值
                    rendered.icon = value;
                    break;
                case "title":
                    rendered.title = typeof value === "string" ? value : String(value);
                    break;
                case "description":
                    rendered.description = typeof value === "string" ? value : String(value);
                    break;
            }
        }

        // 添加全天事件信息（如果存在）
        if (event.allDay !== undefined) {
            rendered.allDay = event.allDay;
        }

        return rendered;
    }

    /**
     * 检查是否可以执行某个操作
     */
    canPerform(action: string, event: Event, user: User): boolean {
        // 查找对应的行为规则
        const behaviorRules = this.dataModel.behaviorRules || [];
        const behaviorRule = behaviorRules.find(
            (rule: any) => rule.name === action
        );
        if (!behaviorRule) {
            return false;
        }

        // 评估行为值
        if (typeof behaviorRule.value === "boolean") {
            return behaviorRule.value;
        }

        // 评估表达式
        return this.evaluateExpression(behaviorRule.value, event, { user });
    }

    /**
     * 评估验证规则
     */
    private evaluateValidationRule(
        rule: any,
        event: Event,
        context: ValidationContext
    ): ValidationResult {
        if (!rule) {
            return { valid: true };
        }

        // When 规则：条件满足时执行子规则
        if (rule.type === "When") {
            const conditionResult = this.evaluateExpression(
                rule.condition,
                event,
                context
            );
            if (conditionResult) {
                const errors: string[] = [];
                for (const subRule of rule.rules || []) {
                    const result = this.evaluateValidationRule(
                        subRule,
                        event,
                        context
                    );
                    if (!result.valid) {
                        errors.push(...(result.errors || []));
                    }
                }
                return {
                    valid: errors.length === 0,
                    errors: errors.length > 0 ? errors : undefined,
                };
            }
            return { valid: true, errors: [] };
        }

        // Between 规则：字段值在范围内
        if (rule.type === "Between") {
            const fieldValue = this.getFieldValue(rule.field, event, context);
            const min = this.getLiteralValue(rule.min);
            const max = this.getLiteralValue(rule.max);

            if (fieldValue === undefined || fieldValue === null) {
                return {
                    valid: false,
                    errors: [`字段 ${rule.field.path.join(".")} 未定义`],
                };
            }

            const numValue =
                typeof fieldValue === "number"
                    ? fieldValue
                    : Number(fieldValue);
            const numMin = typeof min === "number" ? min : Number(min);
            const numMax = typeof max === "number" ? max : Number(max);

            if (isNaN(numValue) || isNaN(numMin) || isNaN(numMax)) {
                return {
                    valid: false,
                    errors: [
                        `字段 ${rule.field.path.join(".")} 无法进行数值比较`,
                    ],
                };
            }

            const valid = numValue >= numMin && numValue <= numMax;
            return {
                valid,
                errors: valid
                    ? undefined
                    : [
                          `字段 ${rule.field.path.join(
                              "."
                          )} 必须在 ${min} 和 ${max} 之间`,
                      ],
            };
        }

        // In 规则：字段值在数组中
        if (rule.type === "In") {
            const fieldValue = this.getFieldValue(rule.field, event, context);

            if (fieldValue === undefined || fieldValue === null) {
                return {
                    valid: false,
                    errors: [`字段 ${rule.field.path.join(".")} 未定义`],
                };
            }

            // 检查字段值是否在值列表中
            const values = rule.values || [];
            const isIn = values.some((value: any) => {
                const literalValue = this.getLiteralValue(value);
                return this.compareValues(fieldValue, literalValue, "equals");
            });

            return {
                valid: isIn,
                errors: isIn
                    ? undefined
                    : [`字段 ${rule.field.path.join(".")} 不在允许的值列表中`],
            };
        }

        // ModComparison 规则：模运算比较表达式（如 startTime.minute mod 15 is 0）
        if (rule.type === "ModComparison") {
            const leftValue = this.getFieldValue(rule.left, event, context);
            const modValue = this.getLiteralValue(rule.modValue);
            const rightValue = this.getLiteralValue(rule.right);

            if (leftValue === undefined || leftValue === null) {
                return {
                    valid: false,
                    errors: [`字段 ${rule.left.path.join(".")} 未定义`],
                };
            }

            // 计算模运算结果
            const leftNum = Number(leftValue);
            const modNum = Number(modValue);
            if (isNaN(leftNum) || isNaN(modNum) || modNum === 0) {
                return {
                    valid: false,
                    errors: [`字段 ${rule.left.path.join(".")} 无法进行模运算`],
                };
            }

            const modResult = leftNum % modNum;
            const result = this.compareValues(
                modResult,
                rightValue,
                rule.operator
            );

            return {
                valid: result,
                errors: result
                    ? undefined
                    : [
                          `验证失败: ${rule.left.path.join(
                              "."
                          )} mod ${modValue} ${
                              rule.operator
                          } ${rightValue} 不满足`,
                      ],
            };
        }

        // Comparison 规则：比较表达式
        if (rule.type === "Comparison") {
            const leftValue = this.getExpressionValue(
                rule.left,
                event,
                context
            );
            const rightValue = this.getLiteralValue(rule.right);
            const result = this.compareValues(
                leftValue,
                rightValue,
                rule.operator
            );

            return {
                valid: result,
                errors: result
                    ? undefined
                    : [`验证失败: ${rule.operator} 比较不满足`],
            };
        }

        // NoConflict 规则：检查时间冲突
        if (rule.type === "NoConflict") {
            const hasConflict = this.checkTimeConflict(
                event,
                context.events || []
            );
            return {
                valid: !hasConflict,
                errors: hasConflict ? ["事件时间与其他事件冲突"] : undefined,
            };
        }

        // Conflict 规则：检查是否有冲突（与 NoConflict 相反）
        if (rule.type === "Conflict") {
            const hasConflict = this.checkTimeConflict(
                event,
                context.events || []
            );
            return {
                valid: hasConflict,
                errors: hasConflict ? undefined : ["事件时间未与其他事件冲突"],
            };
        }

        // BinaryExpression 规则：逻辑表达式（and/or）
        if (rule.type === "BinaryExpression") {
            const leftResult = this.evaluateExpression(
                rule.left,
                event,
                context
            );
            const rightResult = this.evaluateExpression(
                rule.right,
                event,
                context
            );

            if (rule.operator === "and") {
                return { valid: leftResult && rightResult };
            } else if (rule.operator === "or") {
                return { valid: leftResult || rightResult };
            }
        }

        // UnaryExpression 规则：逻辑非
        if (rule.type === "UnaryExpression" && rule.operator === "not") {
            const argResult = this.evaluateExpression(
                rule.argument,
                event,
                context
            );
            return { valid: !argResult };
        }

        // 默认返回有效
        return { valid: true };
    }

    /**
     * 评估显示值
     */
    private evaluateDisplayValue(
        value: any,
        event: Event,
        context: RenderContext
    ): any {
        if (typeof value === "string") {
            return value;
        }

        if (value?.type === "Conditional") {
            const condition = this.evaluateExpression(
                value.condition,
                event,
                context
            );
            return condition
                ? this.evaluateDisplayValue(value.consequent, event, context)
                : value.alternate
                ? this.evaluateDisplayValue(value.alternate, event, context)
                : "";
        }

        if (value?.type === "Template") {
            return this.evaluateTemplate(value, event, context);
        }

        return value;
    }

    /**
     * 评估表达式
     */
    private evaluateExpression(expr: any, event: Event, context: any): boolean {
        if (!expr) {
            return false;
        }

        // FieldAccess：字段访问，转换为布尔值
        if (expr.type === "FieldAccess") {
            const value = this.getFieldValue(expr, event, context);
            return Boolean(value);
        }

        // Comparison：比较表达式
        if (expr.type === "Comparison") {
            const leftValue = this.getExpressionValue(
                expr.left,
                event,
                context
            );
            const rightValue = this.getLiteralValue(expr.right);
            return this.compareValues(leftValue, rightValue, expr.operator);
        }

        // BinaryExpression：逻辑表达式（and/or）
        if (expr.type === "BinaryExpression") {
            const leftResult = this.evaluateExpression(
                expr.left,
                event,
                context
            );
            const rightResult = this.evaluateExpression(
                expr.right,
                event,
                context
            );

            if (expr.operator === "and") {
                return leftResult && rightResult;
            } else if (expr.operator === "or") {
                return leftResult || rightResult;
            }
        }

        // UnaryExpression：逻辑非
        if (expr.type === "UnaryExpression" && expr.operator === "not") {
            const argResult = this.evaluateExpression(
                expr.argument,
                event,
                context
            );
            return !argResult;
        }

        // 默认返回 false
        return false;
    }

    /**
     * 评估模板
     */
    private evaluateTemplate(
        template: any,
        event: Event,
        context: RenderContext
    ): string {
        if (
            !template ||
            template.type !== "Template" ||
            !Array.isArray(template.parts)
        ) {
            return "";
        }

        return template.parts
            .map((part: string | any) => {
                if (typeof part === "string") {
                    return part;
                }
                if (part && part.type === "FieldAccess") {
                    const value = this.getFieldValue(part, event, context);
                    return value !== undefined && value !== null
                        ? String(value)
                        : "";
                }
                return "";
            })
            .join("");
    }

    /**
     * 获取字段值
     */
    private getFieldValue(fieldAccess: any, event: Event, context: any): any {
        if (
            !fieldAccess ||
            fieldAccess.type !== "FieldAccess" ||
            !Array.isArray(fieldAccess.path)
        ) {
            return undefined;
        }

        const path = fieldAccess.path;
        if (path.length === 0) {
            return undefined;
        }

        // 访问 context 中的字段（如 user.email, user.role）- 优先处理
        if (path[0] === "user" && context?.user) {
            let current: any = context.user;
            for (let i = 1; i < path.length; i++) {
                if (current === undefined || current === null) {
                    return undefined;
                }
                current = current[path[i]];
            }
            return current;
        }

        // 特殊字段：startTime, endTime 及其属性访问
        if (path.length >= 1) {
            const fieldName = path[0];

            // 处理 startTime 和 endTime 的属性访问
            if (fieldName === "startTime" || fieldName === "endTime") {
                const timeField =
                    fieldName === "startTime" ? event.startTime : event.endTime;

                // 如果只访问 startTime 或 endTime 本身，返回 Date 对象
                if (path.length === 1) {
                    return timeField;
                }

                // 处理时间字段的属性访问（如 startTime.hour, startTime.date 等）
                if (path.length === 2) {
                    const property = path[1];
                    const date =
                        timeField instanceof Date
                            ? timeField
                            : new Date(timeField);

                    switch (property) {
                        case "hour":
                            // 使用 UTC 小时（事件时间通常使用 UTC）
                            return date.getUTCHours();
                        case "minute":
                            // 使用 UTC 分钟
                            return date.getUTCMinutes();
                        case "second":
                            // 使用 UTC 秒
                            return date.getUTCSeconds();
                        case "day":
                            // 使用 UTC 日期
                            return date.getUTCDate();
                        case "month":
                            // 使用 UTC 月份（0-based to 1-based）
                            return date.getUTCMonth() + 1;
                        case "year":
                            // 使用 UTC 年份
                            return date.getUTCFullYear();
                        case "date":
                            // 返回日期字符串 YYYY-MM-DD（使用 UTC）
                            return date.toISOString().split("T")[0];
                        case "dayOfWeek":
                            // 返回星期几（0=周日，1=周一...，使用 UTC）
                            return date.getUTCDay();
                        case "timeZone":
                            // 返回时区信息（从 event.timeZone 或 recurring.timeZone）
                            return (
                                event.timeZone ||
                                event.recurring?.timeZone ||
                                undefined
                            );
                        default:
                            return undefined;
                    }
                }

                // 不支持更深层的嵌套（如 startTime.date.year）
                return undefined;
            }

            // 处理其他单字段访问
            if (path.length === 1) {
                if (fieldName === "title") {
                    return event.title;
                }
                if (fieldName === "type") {
                    return event.type;
                }
                if (fieldName === "id") {
                    return event.id;
                }
                if (fieldName === "duration") {
                    // 优先使用 event.extra.duration，如果不存在则计算
                    if (event.extra?.duration !== undefined) {
                        return event.extra.duration;
                    }
                    // 计算持续时间（分钟数）
                    const start =
                        event.startTime instanceof Date
                            ? event.startTime
                            : new Date(event.startTime);
                    const end =
                        event.endTime instanceof Date
                            ? event.endTime
                            : new Date(event.endTime);
                    return Math.round(
                        (end.getTime() - start.getTime()) / (1000 * 60)
                    );
                }
                if (fieldName === "now") {
                    // 返回当前时间
                    return context?.now || new Date();
                }
                if (fieldName === "created") {
                    // 返回创建时间（从 metadata）
                    return event.metadata?.createdAt || undefined;
                }
            }
        }

        // 访问 event.extra 中的字段
        if (path[0] === "extra") {
            let current: any = event.extra;
            for (let i = 1; i < path.length; i++) {
                if (current === undefined || current === null) {
                    return undefined;
                }
                // 特殊处理：如果当前值是数组且访问的是 "count"，返回数组长度
                if (Array.isArray(current) && path[i] === "count") {
                    return current.length;
                }
                current = current[path[i]];
            }
            return current;
        }

        // 访问 event.extra 中的嵌套字段（如 priority, status 等）
        // 例如：priority.level, status.value, attendees.count
        if (path.length > 1) {
            let current: any = event.extra;
            for (let i = 0; i < path.length; i++) {
                if (current === undefined || current === null) {
                    return undefined;
                }
                // 特殊处理：如果当前值是数组且访问的是 "count"，返回数组长度
                if (Array.isArray(current) && path[i] === "count") {
                    return current.length;
                }
                current = current[path[i]];
            }
            return current;
        }

        // 直接访问 event.extra[fieldName]
        if (path.length === 1 && event.extra) {
            return event.extra[path[0]];
        }

        return undefined;
    }

    /**
     * 获取表达式值
     */
    private getExpressionValue(expr: any, event: Event, context: any): any {
        if (expr?.type === "FieldAccess") {
            return this.getFieldValue(expr, event, context);
        }
        return expr;
    }

    /**
     * 获取字面量值
     */
    private getLiteralValue(literal: any): any {
        if (literal === null || literal === undefined) {
            return literal;
        }

        // Duration 类型：转换为分钟数
        if (literal?.type === "Duration") {
            const value = literal.value || 0;
            const unit = literal.unit || "minutes";
            const multipliers: Record<string, number> = {
                minutes: 1,
                hours: 60,
                days: 1440,
                weeks: 10080,
            };
            return value * (multipliers[unit] || 1);
        }

        return literal;
    }

    /**
     * 比较两个值
     * 支持日期字符串（YYYY-MM-DD）和时间字符串（HH:mm 或 HH:mm:ss）比较
     */
    private compareValues(left: any, right: any, operator: string): boolean {
        // 处理日期字符串比较（YYYY-MM-DD）
        const leftDateStr = this.parseDateString(left);
        const rightDateStr = this.parseDateString(right);
        if (leftDateStr !== null && rightDateStr !== null) {
            return this.compareDates(leftDateStr, rightDateStr, operator);
        }

        // 处理时间字符串比较（HH:mm 或 HH:mm:ss）
        const leftTimeStr = this.parseTimeString(left);
        const rightTimeStr = this.parseTimeString(right);
        if (leftTimeStr !== null && rightTimeStr !== null) {
            return this.compareTimes(leftTimeStr, rightTimeStr, operator);
        }

        // 处理 Date 对象
        const leftValue = left instanceof Date ? left.getTime() : left;
        const rightValue = right instanceof Date ? right.getTime() : right;

        switch (operator) {
            case "is":
            case "equals":
                return leftValue === rightValue;
            case "is not":
            case "not equals":
                return leftValue !== rightValue;
            case ">":
                return Number(leftValue) > Number(rightValue);
            case ">=":
                return Number(leftValue) >= Number(rightValue);
            case "<":
                return Number(leftValue) < Number(rightValue);
            case "<=":
                return Number(leftValue) <= Number(rightValue);
            default:
                return false;
        }
    }

    /**
     * 解析日期字符串（YYYY-MM-DD）
     * 返回 Date 对象或 null
     */
    private parseDateString(value: any): Date | null {
        if (typeof value !== "string") {
            return null;
        }
        // 匹配 YYYY-MM-DD 格式
        const dateRegex = /^(\d{4})-(\d{2})-(\d{2})$/;
        const match = value.match(dateRegex);
        if (!match) {
            return null;
        }
        const year = parseInt(match[1], 10);
        const month = parseInt(match[2], 10) - 1; // 0-based
        const day = parseInt(match[3], 10);
        const date = new Date(Date.UTC(year, month, day));
        // 验证日期是否有效
        if (
            date.getUTCFullYear() === year &&
            date.getUTCMonth() === month &&
            date.getUTCDate() === day
        ) {
            return date;
        }
        return null;
    }

    /**
     * 解析时间字符串（HH:mm 或 HH:mm:ss）
     * 返回分钟数（从午夜开始）或 null
     */
    private parseTimeString(value: any): number | null {
        if (typeof value !== "string") {
            return null;
        }
        // 匹配 HH:mm 或 HH:mm:ss 格式
        const timeRegex = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/;
        const match = value.match(timeRegex);
        if (!match) {
            return null;
        }
        const hours = parseInt(match[1], 10);
        const minutes = parseInt(match[2], 10);
        if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
            return null;
        }
        return hours * 60 + minutes;
    }

    /**
     * 比较日期（Date 对象）
     */
    private compareDates(left: Date, right: Date, operator: string): boolean {
        const leftTime = left.getTime();
        const rightTime = right.getTime();

        switch (operator) {
            case "is":
            case "equals":
                return leftTime === rightTime;
            case "is not":
            case "not equals":
                return leftTime !== rightTime;
            case ">":
                return leftTime > rightTime;
            case ">=":
                return leftTime >= rightTime;
            case "<":
                return leftTime < rightTime;
            case "<=":
                return leftTime <= rightTime;
            default:
                return false;
        }
    }

    /**
     * 比较时间（分钟数）
     */
    private compareTimes(
        left: number,
        right: number,
        operator: string
    ): boolean {
        switch (operator) {
            case "is":
            case "equals":
                return left === right;
            case "is not":
            case "not equals":
                return left !== right;
            case ">":
                return left > right;
            case ">=":
                return left >= right;
            case "<":
                return left < right;
            case "<=":
                return left <= right;
            default:
                return false;
        }
    }

    /**
     * 检查时间冲突
     */
    private checkTimeConflict(event: Event, otherEvents: Event[]): boolean {
        for (const otherEvent of otherEvents) {
            if (otherEvent.id === event.id) {
                continue; // 跳过自己
            }

            // 检查时间重叠
            const eventStart = event.startTime.getTime();
            const eventEnd = event.endTime.getTime();
            const otherStart = otherEvent.startTime.getTime();
            const otherEnd = otherEvent.endTime.getTime();

            // 重叠条件：eventStart < otherEnd && eventEnd > otherStart
            if (eventStart < otherEnd && eventEnd > otherStart) {
                return true;
            }
        }
        return false;
    }
}

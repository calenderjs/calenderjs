/**
 * Event DSL 类型定义
 *
 * 定义 DSL 的核心类型，包括事件类型定义、字段定义、显示配置、行为配置等
 *
 * **架构说明**：
 * - Event DSL 是生成工具，用于生成符合 Event Data Model 的数据
 * - Event Data Model 是 SSOT，定义了 Event 接口结构（在 @calenderjs/event-model 中）
 * - DSL 编译成 Data Model (Event 对象，包含规则和数据)
 * - **重要**：DSL 必须编译成完整的 Data Model（JSON Schema + 业务规则）
 *   - 运行时使用编译后的 Data Model，而不是直接使用 AST
 */

// JSONSchema 在下面定义，避免重复导入

// ============================================
// 核心 DSL 类型
// ============================================

/**
 * Event DSL 根类型
 *
 * 定义事件类型、验证规则和行为规则
 */
export interface EventDSL {
    /** 事件类型定义列表 */
    types: EventTypeDefinition[];
    /** 全局规则 */
    rules?: EventRule[];
    /** 全局验证器 */
    validators?: EventValidator[];
}

/**
 * 事件类型定义
 *
 * 定义一种事件类型的结构、显示和行为
 * 用于生成符合 Event Data Model 的 Event 对象
 */
export interface EventTypeDefinition {
    /** 类型标识符（唯一） */
    id: string;
    /** 类型名称 */
    name: string;
    /** 类型描述 */
    description?: string;
    /** 字段定义列表 */
    fields: FieldDefinition[];
    /** 显示配置 */
    display: DisplayConfig;
    /** 行为配置 */
    behavior: BehaviorConfig;
    /** 验证规则 */
    validation?: ValidationRule[];
}

// ============================================
// 字段定义
// ============================================

/**
 * 字段定义
 */
export interface FieldDefinition {
    /** 字段名 */
    name: string;
    /** 字段类型 */
    type:
        | "string"
        | "number"
        | "date"
        | "time"
        | "boolean"
        | "enum"
        | "object"
        | "array";
    /** 是否必填 */
    required?: boolean;
    /** 默认值 */
    default?: any;
    /** 字段描述 */
    description?: string;
    /** 枚举值（当 type 为 'enum' 时） */
    enum?: string[];
    /** 对象字段定义（当 type 为 'object' 时） */
    properties?: Record<string, FieldDefinition>;
    /** 数组元素定义（当 type 为 'array' 时） */
    items?: FieldDefinition;
    /** 字段验证规则 */
    validation?: FieldValidationRule[];
}

/**
 * 字段验证规则
 */
export interface FieldValidationRule {
    /** 验证类型 */
    type: "min" | "max" | "minLength" | "maxLength" | "pattern" | "custom";
    /** 验证值 */
    value?: any;
    /** 错误消息 */
    errorMessage: string;
}

// ============================================
// 显示配置
// ============================================

/**
 * 显示配置
 */
export interface DisplayConfig {
    /** 颜色（十六进制或 CSS 颜色值） */
    color: string;
    /** 图标（可选） */
    icon?: string;
    /** 标题模板（支持变量：${fieldName}） */
    titleTemplate?: string;
    /** 描述模板 */
    descriptionTemplate?: string;
    /** 自定义渲染组件（可选） */
    renderComponent?: string;
}

// ============================================
// 行为配置
// ============================================

/**
 * 行为配置
 */
export interface BehaviorConfig {
    /** 是否可拖拽 */
    draggable?: boolean;
    /** 是否可调整大小 */
    resizable?: boolean;
    /** 是否可编辑 */
    editable?: boolean;
    /** 是否可删除 */
    deletable?: boolean;
    /** 是否可复制 */
    copyable?: boolean;
    /** 是否允许重叠 */
    allowOverlap?: boolean;
    /** 最小时长（分钟） */
    minDuration?: number;
    /** 最大时长（分钟） */
    maxDuration?: number;
    /** 默认时长（分钟） */
    defaultDuration?: number;
    /** 时间限制 */
    timeConstraints?: TimeConstraint[];
}

/**
 * 时间限制
 */
export interface TimeConstraint {
    /** 限制类型 */
    type: "workingHours" | "dayOfWeek" | "dateRange" | "custom";
    /** 限制值 */
    value: any;
    /** 错误消息 */
    errorMessage?: string;
}

// ============================================
// 验证规则
// ============================================

/**
 * 验证规则
 */
export interface ValidationRule {
    /** 规则类型 */
    type: "field" | "crossField" | "custom";
    /** 规则表达式（支持函数或表达式字符串） */
    expression: string | Function;
    /** 错误消息 */
    errorMessage: string;
}

/**
 * 全局验证器
 */
export interface EventValidator {
    /** 验证器名称 */
    name: string;
    /** 验证函数 */
    validate: (
        event: any,
        allEvents: any[]
    ) => Promise<import('@calenderjs/event-model').ValidationResult> | import('@calenderjs/event-model').ValidationResult;
}

/**
 * 全局规则
 */
export interface EventRule {
    /** 规则名称 */
    name: string;
    /** 规则表达式 */
    expression: string | Function;
    /** 错误消息 */
    errorMessage: string;
}

// ============================================
// 验证结果
// ============================================

/**
 * 验证结果
 */
export interface ValidationResult {
    /** 是否有效 */
    valid: boolean;
    /** 错误消息列表 */
    errors?: string[];
}

// ============================================
// 渲染结果
// ============================================

/**
 * 渲染后的事件信息
 *
 * 注意：这是 DSL 运行时渲染的结果，用于显示
 * 实际的 Event 对象在 @calenderjs/event-model 中定义
 */
export interface RenderedEvent {
    /** 标题 */
    title: string;
    /** 描述 */
    description?: string;
    /** 颜色 */
    color: string;
    /** 图标 */
    icon?: string;
    /** 是否全天事件 */
    allDay?: boolean;
    /** 其他渲染属性 */
    [key: string]: any;
}

// ============================================
// 注意：Event 接口在 @calenderjs/event-model 中定义
// ============================================

/**
 * Event 接口在 @calenderjs/event-model 中定义
 *
 * DSL 生成符合 Event 接口的数据，而不是定义 Event 接口
 *
 * @see {@link @calenderjs/event-model#Event}
 */

/**
 * 重复规则
 */
export interface RecurringRule {
    /** 频率 */
    frequency: "daily" | "weekly" | "monthly" | "yearly";
    /** 间隔 */
    interval: number;
    /** 结束日期 */
    endDate?: Date;
    /** 重复次数 */
    count?: number;
    /** 星期几（0=周日） */
    daysOfWeek?: number[];
}

// ============================================
// 编译后的类型（Data Model）
// ============================================
// 注意：这些类型已移到 @calenderjs/event-model
// 这里保留类型别名以保持向后兼容，但建议使用 @calenderjs/event-model 中的类型

// 注意：运行时类型（ValidationResult, RenderedEvent 等）已移到 @calenderjs/event-model
// 这里保留导出以保持向后兼容，但建议使用 @calenderjs/event-model 中的类型
export type {
    ValidationResult,
    RenderedEvent,
    ValidatorFunction,
    RendererFunction,
    BehaviorConfig,
} from '@calenderjs/event-model';

// JSONSchema 在下面定义，避免重复导入
import type { ValidatorFunction, RendererFunction, BehaviorConfig } from '@calenderjs/event-model';

// 注意：EventTypeDataModel 在 @calenderjs/event-model 中定义
// DSL 编译成 Data Model，Runtime 使用 Data Model
// 这里不再定义 EventTypeSchema，直接使用 EventTypeDataModel


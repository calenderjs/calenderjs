/**
 * @calenderjs/event-model
 *
 * Event Data Model - Single Source of Truth (SSOT)
 *
 * 此包提供 Event 数据模型的类型定义，作为所有其他包的单一数据源。
 *
 * 依赖关系：
 * - @calenderjs/calendar 依赖此包
 * - @calenderjs/event-dsl 依赖此包
 * - @calenderjs/core 可以依赖此包（可选，如果 core 需要 Event 类型）
 *
 * 根据 RFC-0011 定义
 */

// 导出 Event 核心接口（Data Model - 只定义形状）
export * from "./Event";

// 导出 JSON Schema 类型
export * from "./types";

// 导出 Event 验证器和 JSON Schema
export * from "./validator"; // 包含 EVENT_BASE_SCHEMA, EventValidator

// 导出运行时相关类型（与 Event 相关的运行时类型）
// 注意：ValidationResult 在 validator.ts 中已定义，这里只导出其他类型
export type {
    RenderedEvent,
    ValidatorFunction,
    RendererFunction,
    BehaviorConfig,
} from "./runtime-types";

// 导出 Event Type Data Model（DSL 编译后的结果）
export * from "./EventTypeDataModel"; // 包含 EventTypeDataModel, EventDSLDataModel, EventValidatorDataModel

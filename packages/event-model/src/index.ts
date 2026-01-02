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

// 导出 Event 核心接口
export * from "./Event";

// 导出 JSON Schema 类型
export * from "./types";

// 导出 Event 验证器和 JSON Schema
export * from "./validator"; // 包含 EVENT_BASE_SCHEMA
export * from "./validators/EventValidator";

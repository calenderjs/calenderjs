/**
 * @calenderjs/event-dsl
 * 
 * Event DSL 包 - 提供 DSL 解析、生成和运行时功能
 * 
 * 根据 RFC-0001 定义
 * 
 * 重要：DSL 是生成工具，用于生成符合 Event Data Model 的数据
 * Event Data Model 是 SSOT，定义了 Event 接口结构
 */

// 导出 AST 类型
export * from './ast';

// 导出解析器
export * from './parser';

// 导出运行时
export * from './runtime';

// 导出生成器
export * from './generators/EventDataGenerator';

// 导出编译器
export * from './compiler';

// 导出类型
export * from './types';

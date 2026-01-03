/**
 * @calenderjs/event-dsl
 *
 * Event DSL 包 - 提供 DSL 解析、生成和运行时功能
 *
 * 根据 RFC-0001 定义
 *
 * **架构说明**：
 * - Event DSL 是生成工具，用于生成符合 Event Data Model 的数据
 * - Event Data Model 是 SSOT，定义了 Event 接口结构（在 @calenderjs/event-model 中）
 *
 * **包职责**：
 * 1. **DSL 定义**（核心）：
 *    - DSL 语法定义（.pegjs）
 *    - DSL 解析器（parser）
 *    - AST 类型定义（ast）
 *
 * 2. **DSL 工具**（执行引擎）：
 *    - 编译器（compiler）：编译 DSL → Data Model (Event 对象，包含规则和数据)
 *
 * **重要说明**：
 * - **DSL 的主要用途**：编译成 Data Model (Event 对象，包含规则和数据)
 * - **Calendar 组件**：直接使用 Event 对象，**不需要运行时**
 * - **运行时的用途**（应用层）：
 *   1. 验证用户输入（创建/编辑 Event 时）
 *   2. 权限检查（draggable, editable, deletable）
 *   3. 动态渲染（可选，但 Event 已有 color/icon）
 *
 * **注意**：运行时引擎已移到 `@calenderjs/event-runtime` 包中。
 * 如需使用运行时，请从 `@calenderjs/event-runtime` 导入。
 */

// ============================================
// DSL 定义（核心）
// ============================================

// 导出 AST 类型
export * from "./ast";

// 导出解析器
export * from "./parser";

// 导出类型（避免与 ast 中的类型冲突）
export type {
    EventDSL,
    EventTypeDefinition,
    EventRule,
    EventValidator,
    DisplayConfig,
    FieldValidationRule,
} from "./types";

// 重新导出运行时类型和 Data Model（从 @calenderjs/event-model）
export type {
    EventTypeDataModel,
    EventDSLDataModel,
    EventValidatorDataModel,
    ValidationResult,
    RenderedEvent,
    ValidatorFunction,
    RendererFunction,
    BehaviorConfig,
} from "@calenderjs/event-model";

// ============================================
// DSL 工具（执行引擎）
// ============================================

// 注意：运行时已移到 @calenderjs/event-runtime 包
// 如需使用运行时，请从 @calenderjs/event-runtime 导入

// 导出编译器（编译 DSL → Data Model (Event 对象，包含规则和数据)）
export * from "./compiler";

// 导出生成器（生成 JSON Schema 等）
export * from "./generators";

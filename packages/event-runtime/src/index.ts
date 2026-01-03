/**
 * @calenderjs/event-runtime
 * 
 * Event Runtime - 运行时验证、渲染和行为检查引擎
 * 
 * 根据 RFC-0001 定义
 * 
 * **架构说明**：
 * - Data Model 只定义数据的形状（Event 接口）
 * - DSL 编译后生成 Data Model（EventTypeDataModel）
 * - Runtime 只依赖 Data Model，不依赖 DSL 包
 * - Runtime 接收 Event 对象和 EventTypeDataModel，使用 Data Model 中的规则验证和渲染 Event 数据
 */

export { EventRuntime } from './EventRuntime';
export type {
    EventTypeDataModel,
    ValidationResult,
    RenderedEvent,
} from '@calenderjs/event-model';

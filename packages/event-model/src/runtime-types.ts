/**
 * Runtime Types
 * 
 * 运行时相关类型，与 Event Data Model 相关但不属于 Data Model 本身
 * 
 * **架构说明**：
 * - Data Model 只定义数据的形状（Event 接口）
 * - 这些类型是运行时使用的，用于验证和渲染 Event 数据
 */

/**
 * 验证结果
 */
export interface ValidationResult {
    /** 是否有效 */
    valid: boolean;
    /** 错误消息列表 */
    errors?: string[];
}

/**
 * 渲染后的事件信息
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

/**
 * 验证器函数
 */
export type ValidatorFunction = (event: any) => ValidationResult;

/**
 * 渲染器函数
 */
export type RendererFunction = (event: any) => RenderedEvent;

/**
 * 行为配置
 */
export interface BehaviorConfig {
    draggable: boolean;
    resizable: boolean;
    editable: boolean;
    deletable: boolean;
}

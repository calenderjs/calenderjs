/**
 * Event Type Data Model
 * 
 * **架构说明**：
 * - Data Model 定义事件类型的形状（shape）
 * - DSL 编译成 Data Model
 * - Runtime 只依赖 Data Model，不依赖 DSL
 */

import type { JSONSchema } from './types';
import type {
    ValidatorFunction,
    RendererFunction,
    BehaviorConfig,
} from './runtime-types';

/**
 * Event Type Data Model
 * 
 * 这是 DSL 编译后的结果，包含：
 * 1. JSON Schema（用于 EventValidator 验证结构）
 * 2. 业务规则（用于 Runtime 验证业务逻辑）
 */
export interface EventTypeDataModel {
    id: string;
    name: string;
    /** JSON Schema for Event.extra（从 DSL fields 生成，用于 EventValidator） */
    extraSchema?: JSONSchema;
    /** 业务规则（从 DSL validate 部分生成） */
    validationRules?: any[];
    /** 显示规则（从 DSL display 部分生成） */
    displayRules?: any[];
    /** 行为规则（从 DSL behavior 部分生成） */
    behaviorRules?: any[];
    /** 约束规则（从 DSL constraints 部分生成，用于运行时验证） */
    constraints?: Array<{ name: string; value: any }>;
    /** 重复事件定义（从 DSL recurring 部分生成） */
    recurring?: any;
    validator: ValidatorFunction;
    renderer: RendererFunction;
    behavior: BehaviorConfig;
}

/**
 * Event DSL Data Model
 * 
 * 包含多个事件类型的 Data Model
 */
export interface EventDSLDataModel {
    types: EventTypeDataModel[];
    validators: EventValidatorDataModel[];
}

/**
 * Event Validator Data Model
 */
export interface EventValidatorDataModel {
    name: string;
    validate: ValidatorFunction;
}

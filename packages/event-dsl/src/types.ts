/**
 * Appointment DSL 类型定义
 * 
 * 定义 DSL 的核心类型，包括预约类型、字段定义、显示配置、行为配置等
 */

// ============================================
// 核心 DSL 类型
// ============================================

/**
 * Appointment DSL 根类型
 */
export interface AppointmentDSL {
  /** 预约类型定义列表 */
  types: AppointmentType[];
  /** 全局规则 */
  rules?: AppointmentRule[];
  /** 全局验证器 */
  validators?: AppointmentValidator[];
}

/**
 * 预约类型定义
 */
export interface AppointmentType {
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
  type: 'string' | 'number' | 'date' | 'time' | 'boolean' | 'enum' | 'object' | 'array';
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
  type: 'min' | 'max' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
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
  type: 'workingHours' | 'dayOfWeek' | 'dateRange' | 'custom';
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
  type: 'field' | 'crossField' | 'custom';
  /** 规则表达式（支持函数或表达式字符串） */
  expression: string | Function;
  /** 错误消息 */
  errorMessage: string;
}

/**
 * 全局验证器
 */
export interface AppointmentValidator {
  /** 验证器名称 */
  name: string;
  /** 验证函数 */
  validate: (appointment: any, allAppointments: any[]) => Promise<ValidationResult> | ValidationResult;
}

/**
 * 全局规则
 */
export interface AppointmentRule {
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
 * 渲染后的预约信息
 */
export interface RenderedAppointment {
  /** 标题 */
  title: string;
  /** 描述 */
  description?: string;
  /** 颜色 */
  color: string;
  /** 图标 */
  icon?: string;
  /** 其他渲染属性 */
  [key: string]: any;
}

// ============================================
// 基础预约类型（扩展）
// ============================================

/**
 * 基础预约接口（扩展以支持 DSL）
 */
export interface Appointment {
  /** 唯一标识符 */
  id: string;
  /** 标题 */
  title: string;
  /** 开始时间 */
  startTime: Date;
  /** 结束时间 */
  endTime: Date;
  /** 描述 */
  description?: string;
  /** 颜色 */
  color?: string;
  /** 是否全天事件 */
  allDay?: boolean;
  /** 重复规则 */
  recurring?: RecurringRule;
  /** 参与者列表 */
  attendees?: string[];
  /** 地点 */
  location?: string;
  /** DSL 类型 ID */
  type?: string;
  /** DSL 扩展数据 */
  dslData?: Record<string, any>;
}

/**
 * 重复规则
 */
export interface RecurringRule {
  /** 频率 */
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
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
// 编译后的类型
// ============================================

/**
 * 验证器函数类型
 */
export type ValidatorFunction = (appointment: any) => ValidationResult;

/**
 * 渲染器函数类型
 */
export type RendererFunction = (appointment: any) => RenderedAppointment;

/**
 * 编译后的验证器
 */
export interface CompiledValidator {
  name: string;
  validate: ValidatorFunction;
}

/**
 * 编译后的预约类型
 * 
 * 注意：DSL 是生成工具，用于生成符合 Event Data Model 的数据
 * Event Data Model 是 SSOT，定义了 Event 接口结构
 * 因此不需要在这里存储 JSON Schema
 */
export interface CompiledType {
  id: string;
  name: string;
  validator: ValidatorFunction;
  renderer: RendererFunction;
  behavior: BehaviorConfig;
}

/**
 * 编译后的 DSL
 */
export interface CompiledDSL {
  types: CompiledType[];
  validators: CompiledValidator[];
}

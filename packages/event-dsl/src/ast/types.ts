/**
 * Event DSL AST 类型定义
 * 
 * 根据 RFC-0001 定义
 */

/**
 * Event Type AST 根节点
 */
export interface EventTypeAST {
  type: string;
  name: string;
  description?: string;
  fields: FieldDefinition[];
  validate: ValidationRule[];
  display: DisplayRule[];
  behavior: BehaviorRule[];
  constraints?: ConstraintRule[];
}

/**
 * 字段定义
 */
export interface FieldDefinition {
  name: string;
  type: FieldType;
  required?: boolean;
  default?: any;
  min?: number;
  max?: number;
}

/**
 * 字段类型
 */
export type FieldType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'email'
  | 'text'
  | { type: 'list'; itemType: FieldType }
  | { type: 'enum'; values: string[] };

/**
 * 验证规则
 */
export type ValidationRule =
  | BetweenRule
  | ComparisonRule
  | ConflictRule
  | WhenRule
  | LogicalRule;

/**
 * Between 规则
 */
export interface BetweenRule {
  type: 'Between';
  field: FieldAccess;
  min: any;
  max: any;
}

/**
 * Comparison 规则
 */
export interface ComparisonRule {
  type: 'Comparison';
  operator: string;
  left: FieldAccess | Expression;
  right: any;
}

/**
 * Conflict 规则
 */
export interface ConflictRule {
  type: 'NoConflict' | 'Conflict';
}

/**
 * When 规则
 */
export interface WhenRule {
  type: 'When';
  condition: Expression;
  rules: ValidationRule[];
}

/**
 * 逻辑规则
 */
export interface LogicalRule {
  type: 'BinaryExpression' | 'UnaryExpression';
  operator: 'and' | 'or' | 'not';
  left?: Expression;
  right?: Expression;
  argument?: Expression;
}

/**
 * 字段访问
 */
export interface FieldAccess {
  type: 'FieldAccess';
  path: string[];
}

/**
 * 表达式类型
 */
export type Expression = FieldAccess | ComparisonRule | LogicalRule | any;

/**
 * 显示规则
 */
export interface DisplayRule {
  name: 'color' | 'icon' | 'title' | 'description';
  value: string | ConditionalValue | TemplateValue;
}

/**
 * 条件值
 */
export interface ConditionalValue {
  type: 'Conditional';
  condition: Expression;
  consequent: any;
  alternate?: any;
}

/**
 * 模板值
 */
export interface TemplateValue {
  type: 'Template';
  parts: Array<string | FieldAccess>;
}

/**
 * 行为规则
 */
export interface BehaviorRule {
  name: 'draggable' | 'resizable' | 'editable' | 'deletable';
  value: boolean | Expression;
}

/**
 * 约束规则
 */
export interface ConstraintRule {
  name: string;
  value: any;
}

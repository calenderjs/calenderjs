/**
 * JSON Schema 类型定义
 * 
 * 用于定义 Event.data 字段的验证规则
 */

/**
 * JSON Schema 接口
 * 
 * 符合 JSON Schema Draft 07 规范
 */
export interface JSONSchema {
  /** JSON Schema 版本 */
  $schema?: string;
  
  /** 数据类型 */
  type?: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
  
  /** 属性定义（用于 object 类型） */
  properties?: Record<string, JSONSchema>;
  
  /** 必需属性列表 */
  required?: string[];
  
  /** 是否允许额外属性 */
  additionalProperties?: boolean | JSONSchema;
  
  /** 数组项定义（用于 array 类型） */
  items?: JSONSchema | JSONSchema[];
  
  /** 枚举值（用于 string/number 类型） */
  enum?: (string | number)[];
  
  /** 最小值（用于 number 类型） */
  minimum?: number;
  
  /** 最大值（用于 number 类型） */
  maximum?: number;
  
  /** 最小长度（用于 string/array 类型） */
  minLength?: number;
  
  /** 最大长度（用于 string/array 类型） */
  maxLength?: number;
  
  /** 最小项数（用于 array 类型） */
  minItems?: number;
  
  /** 最大项数（用于 array 类型） */
  maxItems?: number;
  
  /** 格式（用于 string 类型，如 email, date, time 等） */
  format?: string;
  
  /** 默认值 */
  default?: any;
  
  /** 标题 */
  title?: string;
  
  /** 描述 */
  description?: string;
  
  /** 允许扩展其他属性 */
  [key: string]: any;
}

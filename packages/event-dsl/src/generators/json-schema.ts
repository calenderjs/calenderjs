/**
 * JSON Schema 生成器
 * 
 * 从 Event DSL AST 生成 JSON Schema，用于验证 Event.extra 字段
 * 
 * 根据 RFC-0001 定义
 * 
 * **用途**：生成的 JSON Schema 用于 `EventValidator.validateExtra(event, extraSchema)`
 */

import type { EventTypeAST, FieldDefinition, FieldType } from '../ast/types';
import type { JSONSchema } from '@calenderjs/event-model';

/**
 * JSON Schema 生成器选项
 */
export interface JSONSchemaGeneratorOptions {
  /** 是否包含 $schema 字段 */
  includeSchema?: boolean;
  /** 是否包含 title 字段 */
  includeTitle?: boolean;
  /** 是否包含 description 字段 */
  includeDescription?: boolean;
}

/**
 * 从 Event DSL AST 生成 JSON Schema
 * 
 * @param ast - Event DSL AST
 * @param options - 生成器选项
 * @returns JSON Schema（用于验证 Event.extra 字段）
 */
export function generateJSONSchema(
  ast: EventTypeAST,
  options: JSONSchemaGeneratorOptions = {}
): JSONSchema {
  const {
    includeSchema = true,
    includeTitle = true,
    includeDescription = true,
  } = options;

  const schema: JSONSchema = {
    type: 'object',
  };

  if (includeSchema) {
    schema.$schema = 'http://json-schema.org/draft-07/schema#';
  }

  if (includeTitle) {
    if (ast.name) {
      schema.title = ast.name;
    }
  }

  if (includeDescription) {
    if (ast.description) {
      schema.description = ast.description;
    }
  }

  // 生成 properties
  const properties: Record<string, JSONSchema> = {};
  const required: string[] = [];

  ast.fields.forEach(field => {
    const fieldSchema = generateFieldSchema(field);
    properties[field.name] = fieldSchema;

    if (field.required) {
      required.push(field.name);
    }
  });

  schema.properties = properties;

  if (required.length > 0) {
    schema.required = required;
  }

  // 不允许额外属性
  schema.additionalProperties = false;

  return schema;
}

/**
 * 生成字段的 JSON Schema
 * 
 * @param field - 字段定义
 * @returns 字段的 JSON Schema
 */
function generateFieldSchema(field: FieldDefinition): JSONSchema {
  const schema: JSONSchema = {};

  // 根据字段类型生成基础 Schema
  const baseSchema = generateBaseTypeSchema(field.type);
  Object.assign(schema, baseSchema);

  // 添加默认值
  if (field.default !== undefined) {
    schema.default = field.default;
  }

  // 添加 min/max 约束
  if (field.min !== undefined) {
    if (schema.type === 'array') {
      schema.minItems = field.min;
    } else if (schema.type === 'number') {
      schema.minimum = field.min;
    } else if (schema.type === 'string') {
      schema.minLength = field.min;
    }
  }

  if (field.max !== undefined) {
    if (schema.type === 'array') {
      schema.maxItems = field.max;
    } else if (schema.type === 'number') {
      schema.maximum = field.max;
    } else if (schema.type === 'string') {
      schema.maxLength = field.max;
    }
  }

  return schema;
}

/**
 * 生成基础类型 Schema
 * 
 * @param fieldType - 字段类型
 * @returns 基础类型 Schema
 */
function generateBaseTypeSchema(fieldType: FieldType): JSONSchema {
  // 字符串类型
  if (fieldType === 'string') {
    return { type: 'string' };
  }

  // 数字类型
  if (fieldType === 'number') {
    return { type: 'number' };
  }

  // 布尔类型
  if (fieldType === 'boolean') {
    return { type: 'boolean' };
  }

  // Email 类型
  if (fieldType === 'email') {
    return {
      type: 'string',
      format: 'email',
    };
  }

  // 文本类型
  if (fieldType === 'text') {
    return { type: 'string' };
  }

  // 列表类型
  if (typeof fieldType === 'object' && fieldType.type === 'list') {
    const itemSchema = generateBaseTypeSchema(fieldType.itemType);
    return {
      type: 'array',
      items: itemSchema,
    };
  }

  // 枚举类型
  if (typeof fieldType === 'object' && fieldType.type === 'enum') {
    return {
      type: 'string',
      enum: fieldType.values,
    };
  }

  // 默认返回字符串类型
  return { type: 'string' };
}

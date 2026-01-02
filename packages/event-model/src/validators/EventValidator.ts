/**
 * Event 数据验证器
 * 
 * 使用 JSON Schema 验证 Event 数据
 * 
 * 根据 RFC-0011 定义
 */

import Ajv, { type ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';
import type { Event } from '../Event';
import type { JSONSchema } from '../types';

/**
 * 验证结果接口
 */
export interface ValidationResult {
  /** 是否有效 */
  valid: boolean;
  /** 错误消息列表 */
  errors?: string[];
}

/**
 * Event 数据验证器
 * 
 * 使用 JSON Schema 验证 Event 数据是否符合规范
 * 
 * @example
 * ```typescript
 * const validator = new EventValidator();
 * const schema: JSONSchema = {
 *   type: 'object',
 *   properties: {
 *     attendees: { type: 'array', items: { type: 'string', format: 'email' } },
 *     location: { type: 'string' }
 *   },
 *   required: ['attendees']
 * };
 * 
 * const event: Event = {
 *   id: 'event-1',
 *   type: 'meeting',
 *   title: '团队会议',
 *   startTime: new Date('2025-01-15T10:00:00'),
 *   endTime: new Date('2025-01-15T11:00:00'),
 *   data: {
 *     attendees: ['user1@example.com'],
 *     location: '会议室 A'
 *   }
 * };
 * 
 * const result = validator.validate(event, schema);
 * if (!result.valid) {
 *   console.error('验证失败:', result.errors);
 * }
 * ```
 */
export class EventValidator {
  private ajv: Ajv;

  /**
   * 创建 EventValidator 实例
   * 
   * @param options Ajv 配置选项
   */
  constructor(options?: {
    /** 是否显示所有错误（默认: true） */
    allErrors?: boolean;
    /** 是否严格模式（默认: false） */
    strict?: boolean;
    /** 是否移除额外属性（默认: false） */
    removeAdditional?: boolean | 'all' | 'failing';
  }) {
    this.ajv = new Ajv({
      allErrors: options?.allErrors ?? true,
      strict: options?.strict ?? false,
      removeAdditional: options?.removeAdditional ?? false,
    });
    // 添加格式验证支持（email, date, time 等）
    addFormats(this.ajv);
  }

  /**
   * 验证 Event 数据是否符合 JSON Schema
   * 
   * @param event 要验证的 Event 对象
   * @param schema 用于验证 Event.data 的 JSON Schema
   * @returns 验证结果
   */
  validate(event: Event, schema: JSONSchema): ValidationResult {
    // 1. 验证基本字段
    if (!event.id || !event.type || !event.title) {
      return {
        valid: false,
        errors: ['缺少必需字段: id, type, title'],
      };
    }

    // 2. 验证时间
    if (event.startTime >= event.endTime) {
      return {
        valid: false,
        errors: ['开始时间必须早于结束时间'],
      };
    }

    // 3. 使用 JSON Schema 验证 Event.data
    return this.validateData(event.data, schema);
  }

  /**
   * 验证 Event.data 是否符合 JSON Schema
   * 
   * @param data 要验证的数据对象
   * @param schema JSON Schema 定义
   * @returns 验证结果
   */
  validateData(data: Record<string, any>, schema: JSONSchema): ValidationResult {
    try {
      const validate: ValidateFunction = this.ajv.compile(schema);
      const valid = validate(data);

      if (!valid) {
        const errors =
          validate.errors?.map((err) => {
            const path = err.instancePath || err.schemaPath || '';
            const message = err.message || '未知验证错误';
            return path ? `${path}: ${message}` : message;
          }) || ['未知验证错误'];
        return { valid: false, errors };
      }

      return { valid: true, errors: [] };
    } catch (error) {
      return {
        valid: false,
        errors: [`Schema 编译错误: ${error instanceof Error ? error.message : String(error)}`],
      };
    }
  }

  /**
   * 编译 JSON Schema 为验证函数
   * 
   * 用于需要多次验证相同 schema 的场景，可以提前编译以提高性能
   * 
   * @param schema JSON Schema 定义
   * @returns 验证函数
   */
  compile(schema: JSONSchema): (data: Record<string, any>) => ValidationResult {
    try {
      const validate: ValidateFunction = this.ajv.compile(schema);
      return (data: Record<string, any>): ValidationResult => {
        const valid = validate(data);

        if (!valid) {
          const errors =
            validate.errors?.map((err) => {
              const path = err.instancePath || err.schemaPath || '';
              const message = err.message || '未知验证错误';
              return path ? `${path}: ${message}` : message;
            }) || ['未知验证错误'];
          return { valid: false, errors };
        }

        return { valid: true, errors: [] };
      };
    } catch (error) {
      return () => ({
        valid: false,
        errors: [`Schema 编译错误: ${error instanceof Error ? error.message : String(error)}`],
      });
    }
  }
}

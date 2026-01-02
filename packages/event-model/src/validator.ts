/**
 * Event JSON Schema 验证器
 * 
 * 使用 JSON Schema 验证 Event 数据模型
 * 
 * 根据 RFC-0011 定义
 */

import Ajv, { type ValidateFunction, type ErrorObject } from "ajv";
import addFormats from "ajv-formats";
import type { Event } from "./Event";

// Ajv 实例类型
type AjvInstance = InstanceType<typeof Ajv>;

/**
 * 验证结果
 */
export interface ValidationResult {
  /** 是否有效 */
  valid: boolean;
  /** 错误消息列表 */
  errors?: string[];
  /** 原始错误对象（可选，用于调试） */
  errorDetails?: ErrorObject[];
}

/**
 * Event 基础 JSON Schema
 * 
 * 定义 Event 接口的 JSON Schema，用于验证 Event 对象的基本结构
 */
export const EVENT_BASE_SCHEMA = {
  $schema: "http://json-schema.org/draft-07/schema#",
  type: "object",
  required: ["id", "type", "title", "startTime", "endTime"],
  properties: {
    id: {
      type: "string",
      description: "唯一标识符",
    },
    type: {
      type: "string",
      description: "事件类型标识符（如 meeting, task, reminder）",
    },
    title: {
      type: "string",
      description: "事件标题（Calendar 显示用）",
    },
    startTime: {
      type: "string",
      format: "date-time",
      description: "开始时间（ISO 8601 格式，必需 - Event 必须有时间）",
    },
    endTime: {
      type: "string",
      format: "date-time",
      description: "结束时间（ISO 8601 格式，必需 - Event 必须有时间）",
    },
    color: {
      type: "string",
      description: "Calendar 显示颜色（可选）",
    },
    icon: {
      type: "string",
      description: "Calendar 显示图标（可选）",
    },
    extra: {
      type: "object",
      description: "扩展属性（可选，用于详情卡片显示）",
      additionalProperties: true,
    },
    metadata: {
      type: "object",
      description: "事件元数据（可选）",
      properties: {
        createdAt: {
          type: "string",
          format: "date-time",
        },
        updatedAt: {
          type: "string",
          format: "date-time",
        },
        createdBy: {
          type: "string",
        },
        updatedBy: {
          type: "string",
        },
        version: {
          type: "number",
        },
      },
      additionalProperties: false,
    },
  },
  additionalProperties: false,
} as const;

/**
 * Event 验证器类
 * 
 * 提供 Event 数据模型的 JSON Schema 验证功能
 */
export class EventValidator {
  private ajv: AjvInstance;
  private baseValidate: ValidateFunction;

  constructor() {
    // 初始化 Ajv 实例，启用所有格式验证
    this.ajv = new Ajv({
      allErrors: true, // 收集所有错误
      validateFormats: true, // 启用格式验证
    });

    // 添加格式支持（date-time, email 等）
    // 注意：addFormats 需要在 Ajv 实例创建后调用
    addFormats(this.ajv, { mode: "fast", formats: ["date-time", "email", "time"] });

    // 编译基础 Event Schema
    this.baseValidate = this.ajv.compile(EVENT_BASE_SCHEMA);
  }

  /**
   * 验证 Event 对象是否符合基础 Event Schema
   * 
   * @param event - 要验证的 Event 对象
   * @returns 验证结果
   */
  validateBase(event: Event): ValidationResult {
    // 将 Event 转换为 JSON（Date 对象转换为 ISO 字符串）
    const eventJson = this.eventToJson(event);

    // 执行验证
    const valid = this.baseValidate(eventJson);

    if (valid) {
      return { valid: true, errors: [] };
    }

    // 收集错误消息
    const errors = this.baseValidate.errors?.map((error: ErrorObject) => {
      const path = (error.instancePath || error.schemaPath || "").toString();
      return `${path}: ${error.message || "验证失败"}`;
    }) || [];

    return {
      valid: false,
      errors,
      errorDetails: this.baseValidate.errors || [],
    };
  }

  /**
   * 验证 Event.extra 字段是否符合指定的 JSON Schema
   * 
   * @param event - 要验证的 Event 对象
   * @param extraSchema - Event.extra 字段的 JSON Schema
   * @returns 验证结果
   */
  validateExtra(event: Event, extraSchema: any): ValidationResult {
    // 验证基础结构
    const baseResult = this.validateBase(event);
    if (!baseResult.valid) {
      return baseResult;
    }

    // 如果 event.extra 不存在，跳过验证
    if (!event.extra) {
      return { valid: true, errors: [] };
    }

    // 编译 extra Schema
    const validateExtra = this.ajv.compile({
      $schema: "http://json-schema.org/draft-07/schema#",
      ...extraSchema,
    });

    // 验证 extra 字段
    const valid = validateExtra(event.extra);

    if (valid) {
      return { valid: true, errors: [] };
    }

    // 收集错误消息
    const errors = validateExtra.errors?.map((error: ErrorObject) => {
      const path = (error.instancePath || error.schemaPath || "").toString();
      return `extra${path}: ${error.message || "验证失败"}`;
    }) || [];

    return {
      valid: false,
      errors,
      errorDetails: validateExtra.errors || [],
    };
  }

  /**
   * 验证 Event 对象是否符合完整的 Schema（包括基础结构和 extra 字段）
   * 
   * @param event - 要验证的 Event 对象
   * @param extraSchema - Event.extra 字段的 JSON Schema（可选）
   * @returns 验证结果
   */
  validate(event: Event, extraSchema?: any): ValidationResult {
    // 如果提供了 extraSchema，验证完整结构
    if (extraSchema) {
      return this.validateExtra(event, extraSchema);
    }

    // 否则只验证基础结构
    return this.validateBase(event);
  }

  /**
   * 将 Event 对象转换为 JSON（Date 对象转换为 ISO 字符串）
   * 
   * @param event - Event 对象
   * @returns JSON 对象
   */
  private eventToJson(event: Event): any {
    const json: any = {
      id: event.id,
      type: event.type,
      title: event.title,
      startTime: event.startTime instanceof Date
        ? event.startTime.toISOString()
        : event.startTime,
      endTime: event.endTime instanceof Date
        ? event.endTime.toISOString()
        : event.endTime,
    };

    if (event.color) {
      json.color = event.color;
    }

    if (event.icon) {
      json.icon = event.icon;
    }

    if (event.extra) {
      json.extra = event.extra;
    }

    if (event.metadata) {
      json.metadata = {
        ...event.metadata,
        createdAt:
          event.metadata.createdAt instanceof Date
            ? event.metadata.createdAt.toISOString()
            : event.metadata.createdAt,
        updatedAt:
          event.metadata.updatedAt instanceof Date
            ? event.metadata.updatedAt.toISOString()
            : event.metadata.updatedAt,
        createdBy: event.metadata.createdBy,
        updatedBy: event.metadata.updatedBy,
        version: event.metadata.version,
      };
    }

    return json;
  }

  /**
   * 验证时间逻辑（开始时间必须早于结束时间）
   * 
   * @param event - Event 对象
   * @returns 验证结果
   */
  validateTimeLogic(event: Event): ValidationResult {
    const startTime =
      event.startTime instanceof Date
        ? event.startTime
        : new Date(event.startTime);
    const endTime =
      event.endTime instanceof Date ? event.endTime : new Date(event.endTime);

    if (startTime >= endTime) {
      return {
        valid: false,
        errors: ["开始时间必须早于结束时间"],
      };
    }

    return { valid: true, errors: [] };
  }
}

/**
 * 默认验证器实例
 */
export const defaultEventValidator = new EventValidator();

/**
 * EventType 接口
 * 
 * 根据 RFC-0001 定义的事件类型定义接口
 */

import type { Event } from '@calenderjs/event-model';
import { User } from './User';
import { ValidationContext } from '../contexts/ValidationContext';
import { RenderContext } from '../contexts/RenderContext';
import { ValidationResult } from '../types/common';
import { RenderedEvent } from '../types/common';

/**
 * JSON Schema 类型
 */
export interface JSONSchema {
  $schema?: string;
  type: 'object' | 'array' | 'string' | 'number' | 'boolean';
  properties?: Record<string, any>;
  required?: string[];
  additionalProperties?: boolean;
  [key: string]: any;
}

/**
 * 事件类型定义接口
 */
export interface EventTypeDefinition {
  /** 事件类型标识符 */
  type: string;
  /** 类型名称 */
  name: string;
  /** 类型描述 */
  description?: string;
  /** JSON Schema（用于运行时验证） */
  schema: JSONSchema;
  /** 验证函数（可选） */
  validate?: (event: Event, context: ValidationContext) => ValidationResult;
  /** 渲染函数（可选） */
  render?: (event: Event, context: RenderContext) => RenderedEvent;
  /** 权限检查函数（可选） */
  canPerform?: (action: string, event: Event, user: User) => boolean;
}

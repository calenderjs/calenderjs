/**
 * Event 数据生成器
 * 
 * 从 Event DSL 定义生成符合 Event Data Model 的 Event 数据
 * 
 * DSL 是生成工具，用于生成符合 Event Data Model 的数据，而不是定义数据模型
 */

import type { Event, EventMetadata } from '@calenderjs/event-model';
import type { AppointmentType, FieldDefinition } from '../types';

/**
 * Event 数据生成器
 * 
 * 从 DSL 定义生成符合 Event Data Model 的 Event 对象
 */
export class EventDataGenerator {
  /**
   * 从 DSL 定义生成 Event 数据示例
   * 
   * @param dslType - DSL 类型定义
   * @param overrides - 可选的覆盖值
   * @returns 符合 Event Data Model 的 Event 对象
   */
  generateEvent(
    dslType: AppointmentType,
    overrides?: Partial<Event>
  ): Event {
    // 根据字段定义生成 data 字段的默认值
    const data: Record<string, any> = {};

    dslType.fields.forEach(field => {
      data[field.name] = this.generateFieldValue(field);
    });

    // 生成默认时间（当前时间 + 1小时）
    const now = new Date();
    const defaultStartTime = overrides?.startTime || now;
    const defaultEndTime = overrides?.endTime || new Date(now.getTime() + 60 * 60 * 1000);

    // 生成标题（使用模板或默认值）
    const title = this.generateTitle(dslType, data, overrides?.title);

    return {
      id: overrides?.id || this.generateId(),
      type: dslType.id,
      title: title,
      startTime: defaultStartTime,
      endTime: defaultEndTime,
      color: dslType.display?.color || overrides?.color,
      icon: dslType.display?.icon || overrides?.icon,
      extra: { ...data, ...(overrides?.extra || {}) },
      metadata: overrides?.metadata || this.generateMetadata(),
    };
  }

  /**
   * 生成字段默认值
   */
  private generateFieldValue(field: FieldDefinition): any {
    // 如果有默认值，使用默认值
    if (field.default !== undefined) {
      return field.default;
    }

    // 根据字段类型生成默认值
    switch (field.type) {
      case 'string':
      case 'text':
      case 'email':
        return '';
      case 'number':
        return 0;
      case 'boolean':
        return false;
      case 'date':
        return new Date().toISOString();
      case 'time':
        return '00:00';
      case 'enum':
        return field.enum?.[0] || '';
      case 'array':
        return [];
      case 'object':
        return {};
      default:
        return null;
    }
  }

  /**
   * 生成标题
   */
  private generateTitle(
    dslType: AppointmentType,
    data: Record<string, any>,
    overrideTitle?: string
  ): string {
    if (overrideTitle) {
      return overrideTitle;
    }

    // 如果有标题模板，使用模板
    if (dslType.display?.titleTemplate) {
      return this.renderTemplate(dslType.display.titleTemplate, data);
    }

    // 否则使用类型名称
    return dslType.name || dslType.id;
  }

  /**
   * 渲染模板（支持 ${fieldName} 变量替换）
   */
  private renderTemplate(template: string, data: any): string {
    return template.replace(/\${([^}]+)}/g, (match, key) => {
      const value = this.getNestedValue(data, key.trim());
      return value !== undefined && value !== null ? String(value) : '';
    });
  }

  /**
   * 获取嵌套值（支持点号路径，如 attendees.length）
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      if (current === null || current === undefined) {
        return undefined;
      }
      return current[key];
    }, obj);
  }

  /**
   * 生成唯一 ID
   */
  private generateId(): string {
    return `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 生成元数据
   */
  private generateMetadata(): EventMetadata {
    const now = new Date();
    return {
      createdAt: now,
      updatedAt: now,
    };
  }
}

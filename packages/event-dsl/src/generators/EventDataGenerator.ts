/**
 * Event 数据生成器
 *
 * 根据 RFC-0011 定义：从 Event DSL 定义生成符合 Event Data Model（@calenderjs/event-model）单一事实来源（SSOT）的 Event 对象。
 */

import type { Event, EventMetadata, RecurringRule } from "@calenderjs/event-model";
import type { EventTypeAST, FieldDefinition, FieldType } from "../ast/types";
import type { EventTypeDefinition, FieldDefinition as DSLFieldDefinition } from "../types";
import { parseEventDSL } from "../parser/parse";

/**
 * EventDataGenerator 选项
 */
export interface EventDataGeneratorOptions {
  /** 默认时区，未指定时为 undefined（保持 UTC 或由外部指定） */
  timeZone?: string;
  /** 默认事件时长（分钟），默认为 60 */
  defaultDurationMinutes?: number;
}

/**
 * 接受的 DSL 输入类型：EventTypeAST、EventTypeDefinition 或 DSL 文本字符串
 */
export type EventDefinitionInput = EventTypeAST | EventTypeDefinition | string;

export class EventDataGenerator {
  private defaultDurationMinutes: number;
  private timeZone?: string;

  constructor(options: EventDataGeneratorOptions = {}) {
    this.defaultDurationMinutes = options.defaultDurationMinutes ?? 60;
    this.timeZone = options.timeZone;
  }

  /**
   * 从 DSL 定义生成符合 Event Data Model 的 Event 对象
   *
   * @param definition DSL 定义（EventTypeAST、EventTypeDefinition 或 DSL 文本）
   * @param overrides 用户自定义的字段覆盖
   * @returns 符合 Event 接口的实例
   */
  generateEvent(
    definition: EventDefinitionInput,
    overrides?: Partial<Event>,
  ): Event {
    const ast = this.normalizeDefinition(definition);

    // 1. 生成 data 业务数据
    const data: Record<string, any> = {};
    if (Array.isArray(ast.fields)) {
      for (const field of ast.fields) {
        data[field.name] = this.generateFieldValue(field);
      }
    }

    // 2. 计算开始与结束时间
    const now = new Date();
    const startTime = overrides?.startTime ? new Date(overrides.startTime) : now;
    const durationMs = this.resolveDurationMinutes(ast) * 60 * 1000;
    const endTime = overrides?.endTime
      ? new Date(overrides.endTime)
      : new Date(startTime.getTime() + durationMs);

    // 合并 data 覆盖（标题插值需要使用最终 data）
    const mergedData = {
      ...data,
      ...(overrides?.data || {}),
    };

    // 3. 计算标题
    const title = this.generateTitle(ast, mergedData, overrides?.title);

    // 4. 计算显示样式（颜色、图标）
    const { color, icon } = this.resolveDisplay(ast);

    // 5. 计算重复规则
    const recurring = this.resolveRecurring(ast);

    // 6. 构造元数据
    const metadata: EventMetadata = {
      createdAt: now,
      updatedAt: now,
      ...(overrides?.metadata || {}),
    };

    const event: Event = {
      id: overrides?.id || this.generateId(),
      type: ast.type,
      title,
      startTime,
      endTime,
      data: mergedData,
      metadata,
    };

    if (overrides?.color !== undefined) {
      event.color = overrides.color;
    } else if (color !== undefined) {
      event.color = color;
    }

    if (overrides?.icon !== undefined) {
      event.icon = overrides.icon;
    } else if (icon !== undefined) {
      event.icon = icon;
    }

    const timeZone = overrides?.timeZone || this.timeZone;
    if (timeZone) {
      event.timeZone = timeZone;
    }

    if (overrides?.allDay !== undefined) {
      event.allDay = overrides.allDay;
    }

    if (overrides?.recurring !== undefined) {
      event.recurring = overrides.recurring;
    } else if (recurring) {
      event.recurring = recurring;
    }

    if (overrides?.parentEventId) {
      event.parentEventId = overrides.parentEventId;
    }

    if (overrides?.recurrenceId) {
      event.recurrenceId = overrides.recurrenceId;
    }

    return event;
  }

  /**
   * 批量生成 Event
   */
  generateEvents(
    definition: EventDefinitionInput,
    count: number,
    overridesFactory?: (index: number) => Partial<Event>,
  ): Event[] {
    const events: Event[] = [];
    for (let i = 0; i < count; i++) {
      const overrides = overridesFactory ? overridesFactory(i) : undefined;
      events.push(this.generateEvent(definition, overrides));
    }
    return events;
  }

  /**
   * 将不同形式的定义规范化为 EventTypeAST 结构
   */
  private normalizeDefinition(input: EventDefinitionInput): EventTypeAST {
    if (typeof input === "string") {
      return parseEventDSL(input);
    }
    // 处理 types.ts 的 EventTypeDefinition（id 映射为 type）
    if ("id" in input && !("type" in input)) {
      const def = input as EventTypeDefinition;
      const astFields: FieldDefinition[] = def.fields.map((f) => ({
        name: f.name,
        type: this.mapDSLFieldType(f),
        required: f.required,
        default: f.default,
      }));
      const displayRules: any[] = [];
      if (def.display) {
        if (def.display.color) {
          displayRules.push({ name: "color", value: def.display.color });
        }
        if (def.display.icon) {
          displayRules.push({ name: "icon", value: def.display.icon });
        }
        if (def.display.titleTemplate) {
          displayRules.push({ name: "title", value: def.display.titleTemplate });
        }
      }
      return {
        type: def.id,
        name: def.name,
        description: def.description,
        fields: astFields,
        validate: [],
        display: displayRules,
        behavior: [],
      };
    }
    return input as EventTypeAST;
  }

  /**
   * 映射 EventTypeDefinition 的字段类型到 AST 字段类型
   */
  private mapDSLFieldType(f: DSLFieldDefinition): FieldType {
    if (f.type === "enum") {
      return { type: "enum", values: f.enum || [] };
    }
    if (f.type === "array") {
      const itemType = f.items ? this.mapDSLFieldType(f.items) : "string";
      return { type: "list", itemType };
    }
    if (f.type === "number" || f.type === "boolean") {
      return f.type;
    }
    return "string";
  }

  /**
   * 生成单个字段的默认值
   */
  private generateFieldValue(field: FieldDefinition): any {
    if (field.default !== undefined) {
      return field.default;
    }

    const type = field.type;

    if (typeof type === "string") {
      switch (type) {
        case "string":
        case "text":
          return "";
        case "number":
          return 0;
        case "boolean":
          return false;
        case "email":
          return "user@example.com";
        default:
          return "";
      }
    }

    if (typeof type === "object") {
      if (type.type === "list") {
        return [];
      }
      if (type.type === "enum") {
        return type.values && type.values.length > 0 ? type.values[0] : "";
      }
    }

    return null;
  }

  /**
   * 生成事件标题
   */
  private generateTitle(
    ast: EventTypeAST,
    data: Record<string, any>,
    overrideTitle?: string,
  ): string {
    if (overrideTitle !== undefined) {
      return overrideTitle;
    }

    // 寻找 display 规则中的 title
    const titleRule = ast.display?.find((rule) => rule.name === "title");
    if (titleRule) {
      if (typeof titleRule.value === "string") {
        return this.interpolateTemplate(titleRule.value, data, ast.name);
      }
      if (titleRule.value && typeof titleRule.value === "object" && "type" in titleRule.value) {
        if (titleRule.value.type === "Template") {
          return titleRule.value.parts
            .map((part) => {
              if (typeof part === "string") return part;
              if (part && typeof part === "object" && part.type === "FieldAccess") {
                const val = this.resolvePath(data, part.path);
                return val !== undefined ? String(val) : "";
              }
              return "";
            })
            .join("");
        }
      }
    }

    return ast.name || ast.type || "Untitled Event";
  }

  /**
   * 提取事件显示配置（color, icon）
   */
  private resolveDisplay(ast: EventTypeAST): { color?: string; icon?: string } {
    let color: string | undefined;
    let icon: string | undefined;

    for (const rule of ast.display || []) {
      if (rule.name === "color" && typeof rule.value === "string") {
        color = rule.value;
      }
      if (rule.name === "icon" && typeof rule.value === "string") {
        icon = rule.value;
      }
    }

    return { color, icon };
  }

  /**
   * 解析默认时长（分钟）
   */
  private resolveDurationMinutes(ast: EventTypeAST): number {
    const durationRule = ast.behavior?.find(
      (rule) => (rule.name as string) === "defaultDuration",
    );
    if (durationRule && typeof durationRule.value === "number") {
      return durationRule.value;
    }
    return this.defaultDurationMinutes;
  }

  /**
   * 解析 recurring 规则
   */
  private resolveRecurring(ast: EventTypeAST): RecurringRule | undefined {
    if (!ast.recurring) return undefined;
    const r = ast.recurring;
    const rule: RecurringRule = {
      frequency: r.frequency,
      interval: r.interval || 1,
    };
    if (r.endDate) {
      rule.endDate = new Date(r.endDate);
    }
    if (r.count !== undefined) {
      rule.count = r.count;
    }
    if (r.daysOfWeek) {
      rule.daysOfWeek = r.daysOfWeek;
    }
    if (r.dayOfMonth) {
      rule.dayOfMonth = r.dayOfMonth;
    }
    if (r.excludeDates) {
      rule.excludeDates = r.excludeDates.map((d) => new Date(d));
    }
    return rule;
  }

  /**
   * 模板插值：${fieldName}
   */
  private interpolateTemplate(
    template: string,
    data: Record<string, any>,
    fallback: string,
  ): string {
    const res = template.replace(/\$\{([^}]+)\}/g, (_, key) => {
      const trimmed = key.trim();
      const val = data[trimmed];
      return val !== undefined ? String(val) : "";
    });
    return res || fallback;
  }

  /**
   * 读取对象嵌套路径
   */
  private resolvePath(obj: any, path: string[]): any {
    let curr = obj;
    for (const seg of path) {
      if (curr === undefined || curr === null) return undefined;
      curr = curr[seg];
    }
    return curr;
  }

  /**
   * 生成唯一 ID
   */
  private generateId(): string {
    return `event-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}

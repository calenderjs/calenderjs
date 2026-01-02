/**
 * EventValidator 测试
 */

import { describe, it, expect } from 'vitest';
import { EventValidator } from '../EventValidator';
import type { Event } from '../../Event';
import type { JSONSchema } from '../../types';

describe('EventValidator', () => {
  describe('validate', () => {
    it('应该验证基本字段', () => {
      const validator = new EventValidator();
      const schema: JSONSchema = {
        type: 'object',
        properties: {},
      };

      // 缺少 id
      const event1: Partial<Event> = {
        type: 'meeting',
        title: '测试',
        startTime: new Date('2025-01-15T10:00:00'),
        endTime: new Date('2025-01-15T11:00:00'),
        data: {},
      };
      const result1 = validator.validate(event1 as Event, schema);
      expect(result1.valid).toBe(false);
      expect(result1.errors).toContain('缺少必需字段: id, type, title');

      // 缺少 type
      const event2: Partial<Event> = {
        id: 'event-1',
        title: '测试',
        startTime: new Date('2025-01-15T10:00:00'),
        endTime: new Date('2025-01-15T11:00:00'),
        data: {},
      };
      const result2 = validator.validate(event2 as Event, schema);
      expect(result2.valid).toBe(false);

      // 缺少 title
      const event3: Partial<Event> = {
        id: 'event-1',
        type: 'meeting',
        startTime: new Date('2025-01-15T10:00:00'),
        endTime: new Date('2025-01-15T11:00:00'),
        data: {},
      };
      const result3 = validator.validate(event3 as Event, schema);
      expect(result3.valid).toBe(false);
    });

    it('应该验证时间范围', () => {
      const validator = new EventValidator();
      const schema: JSONSchema = {
        type: 'object',
        properties: {},
      };

      // 开始时间晚于结束时间
      const event: Event = {
        id: 'event-1',
        type: 'meeting',
        title: '测试',
        startTime: new Date('2025-01-15T11:00:00'),
        endTime: new Date('2025-01-15T10:00:00'),
        data: {},
      };
      const result = validator.validate(event, schema);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('开始时间必须早于结束时间');
    });

    it('应该使用 JSON Schema 验证 Event.data', () => {
      const validator = new EventValidator();
      const schema: JSONSchema = {
        type: 'object',
        properties: {
          attendees: {
            type: 'array',
            items: { type: 'string', format: 'email' },
            minItems: 1,
          },
          location: { type: 'string' },
        },
        required: ['attendees'],
      };

      // 有效的事件
      const validEvent: Event = {
        id: 'event-1',
        type: 'meeting',
        title: '团队会议',
        startTime: new Date('2025-01-15T10:00:00'),
        endTime: new Date('2025-01-15T11:00:00'),
        data: {
          attendees: ['user1@example.com', 'user2@example.com'],
          location: '会议室 A',
        },
      };
      const validResult = validator.validate(validEvent, schema);
      expect(validResult.valid).toBe(true);
      expect(validResult.errors).toEqual([]);

      // 缺少必需字段
      const invalidEvent1: Event = {
        id: 'event-2',
        type: 'meeting',
        title: '团队会议',
        startTime: new Date('2025-01-15T10:00:00'),
        endTime: new Date('2025-01-15T11:00:00'),
        data: {
          location: '会议室 A',
        },
      };
      const invalidResult1 = validator.validate(invalidEvent1, schema);
      expect(invalidResult1.valid).toBe(false);
      expect(invalidResult1.errors?.length).toBeGreaterThan(0);

      // 无效的 email 格式
      const invalidEvent2: Event = {
        id: 'event-3',
        type: 'meeting',
        title: '团队会议',
        startTime: new Date('2025-01-15T10:00:00'),
        endTime: new Date('2025-01-15T11:00:00'),
        data: {
          attendees: ['invalid-email'],
          location: '会议室 A',
        },
      };
      const invalidResult2 = validator.validate(invalidEvent2, schema);
      expect(invalidResult2.valid).toBe(false);
      expect(invalidResult2.errors?.length).toBeGreaterThan(0);
    });
  });

  describe('validateData', () => {
    it('应该验证数据对象', () => {
      const validator = new EventValidator();
      const schema: JSONSchema = {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1 },
          age: { type: 'number', minimum: 0, maximum: 150 },
        },
        required: ['name'],
      };

      // 有效数据
      const validData = { name: 'John', age: 30 };
      const validResult = validator.validateData(validData, schema);
      expect(validResult.valid).toBe(true);

      // 无效数据 - 缺少必需字段
      const invalidData1 = { age: 30 };
      const invalidResult1 = validator.validateData(invalidData1, schema);
      expect(invalidResult1.valid).toBe(false);

      // 无效数据 - 类型错误
      const invalidData2 = { name: 'John', age: '30' };
      const invalidResult2 = validator.validateData(invalidData2, schema);
      expect(invalidResult2.valid).toBe(false);
    });

    it('应该处理数组类型', () => {
      const validator = new EventValidator();
      const schema: JSONSchema = {
        type: 'object',
        properties: {
          tags: {
            type: 'array',
            items: { type: 'string' },
            minItems: 1,
            maxItems: 10,
          },
        },
        required: ['tags'],
      };

      // 有效数据
      const validData = { tags: ['tag1', 'tag2'] };
      const validResult = validator.validateData(validData, schema);
      expect(validResult.valid).toBe(true);

      // 无效数据 - 空数组
      const invalidData1 = { tags: [] };
      const invalidResult1 = validator.validateData(invalidData1, schema);
      expect(invalidResult1.valid).toBe(false);

      // 无效数据 - 超过最大项数
      const invalidData2 = { tags: Array(11).fill('tag') };
      const invalidResult2 = validator.validateData(invalidData2, schema);
      expect(invalidResult2.valid).toBe(false);
    });

    it('应该处理枚举类型', () => {
      const validator = new EventValidator();
      const schema: JSONSchema = {
        type: 'object',
        properties: {
          priority: {
            type: 'string',
            enum: ['low', 'normal', 'high'],
          },
        },
        required: ['priority'],
      };

      // 有效数据
      const validData = { priority: 'normal' };
      const validResult = validator.validateData(validData, schema);
      expect(validResult.valid).toBe(true);

      // 无效数据 - 不在枚举中
      const invalidData = { priority: 'urgent' };
      const invalidResult = validator.validateData(invalidData, schema);
      expect(invalidResult.valid).toBe(false);
    });
  });

  describe('compile', () => {
    it('应该编译 schema 为验证函数', () => {
      const validator = new EventValidator();
      const schema: JSONSchema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
        required: ['name'],
      };

      const validateFn = validator.compile(schema);

      // 有效数据
      const validResult = validateFn({ name: 'John' });
      expect(validResult.valid).toBe(true);

      // 无效数据
      const invalidResult = validateFn({});
      expect(invalidResult.valid).toBe(false);
    });

    it('应该处理编译错误', () => {
      const validator = new EventValidator();
      const invalidSchema: JSONSchema = {
        type: 'object',
        properties: {
          name: { type: 'invalid-type' as any },
        },
      };

      const validateFn = validator.compile(invalidSchema);
      const result = validateFn({ name: 'John' });
      expect(result.valid).toBe(false);
      expect(result.errors?.some((err) => err.includes('Schema 编译错误'))).toBe(true);
    });
  });
});

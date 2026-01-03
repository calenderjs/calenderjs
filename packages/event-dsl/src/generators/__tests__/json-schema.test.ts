/**
 * JSON Schema 生成器测试
 */

import { describe, it, expect } from 'vitest';
import { generateJSONSchema } from '../json-schema';
import type { EventTypeAST } from '../../ast/types';

describe('generateJSONSchema', () => {
  describe('基础字段类型', () => {
    it('应该生成 string 类型字段的 Schema', () => {
      const ast: EventTypeAST = {
        type: 'test',
        name: '测试',
        fields: [
          { name: 'title', type: 'string', required: true },
        ],
        validate: [],
        display: [],
        behavior: [],
      };

      const schema = generateJSONSchema(ast);

      expect(schema.properties?.title).toEqual({
        type: 'string',
      });
      expect(schema.required).toContain('title');
    });

    it('应该生成 number 类型字段的 Schema', () => {
      const ast: EventTypeAST = {
        type: 'test',
        name: '测试',
        fields: [
          { name: 'count', type: 'number', required: true },
        ],
        validate: [],
        display: [],
        behavior: [],
      };

      const schema = generateJSONSchema(ast);

      expect(schema.properties?.count).toEqual({
        type: 'number',
      });
    });

    it('应该生成 boolean 类型字段的 Schema', () => {
      const ast: EventTypeAST = {
        type: 'test',
        name: '测试',
        fields: [
          { name: 'isActive', type: 'boolean', required: true },
        ],
        validate: [],
        display: [],
        behavior: [],
      };

      const schema = generateJSONSchema(ast);

      expect(schema.properties?.isActive).toEqual({
        type: 'boolean',
      });
    });

    it('应该生成 email 类型字段的 Schema', () => {
      const ast: EventTypeAST = {
        type: 'test',
        name: '测试',
        fields: [
          { name: 'email', type: 'email', required: true },
        ],
        validate: [],
        display: [],
        behavior: [],
      };

      const schema = generateJSONSchema(ast);

      expect(schema.properties?.email).toEqual({
        type: 'string',
        format: 'email',
      });
    });

    it('应该生成 text 类型字段的 Schema', () => {
      const ast: EventTypeAST = {
        type: 'test',
        name: '测试',
        fields: [
          { name: 'description', type: 'text', required: true },
        ],
        validate: [],
        display: [],
        behavior: [],
      };

      const schema = generateJSONSchema(ast);

      expect(schema.properties?.description).toEqual({
        type: 'string',
      });
    });
  });

  describe('复杂字段类型', () => {
    it('应该生成 list 类型字段的 Schema', () => {
      const ast: EventTypeAST = {
        type: 'test',
        name: '测试',
        fields: [
          { name: 'attendees', type: { type: 'list', itemType: 'email' }, required: true },
        ],
        validate: [],
        display: [],
        behavior: [],
      };

      const schema = generateJSONSchema(ast);

      expect(schema.properties?.attendees).toEqual({
        type: 'array',
        items: {
          type: 'string',
          format: 'email',
        },
      });
    });

    it('应该生成嵌套 list 类型字段的 Schema', () => {
      const ast: EventTypeAST = {
        type: 'test',
        name: '测试',
        fields: [
          { name: 'tags', type: { type: 'list', itemType: 'string' }, required: true },
        ],
        validate: [],
        display: [],
        behavior: [],
      };

      const schema = generateJSONSchema(ast);

      expect(schema.properties?.tags).toEqual({
        type: 'array',
        items: {
          type: 'string',
        },
      });
    });

    it('应该生成 enum 类型字段的 Schema', () => {
      const ast: EventTypeAST = {
        type: 'test',
        name: '测试',
        fields: [
          { name: 'priority', type: { type: 'enum', values: ['low', 'normal', 'high'] }, required: true },
        ],
        validate: [],
        display: [],
        behavior: [],
      };

      const schema = generateJSONSchema(ast);

      expect(schema.properties?.priority).toEqual({
        type: 'string',
        enum: ['low', 'normal', 'high'],
      });
    });
  });

  describe('字段修饰符', () => {
    it('应该支持 required 修饰符', () => {
      const ast: EventTypeAST = {
        type: 'test',
        name: '测试',
        fields: [
          { name: 'title', type: 'string', required: true },
          { name: 'description', type: 'string', required: false },
        ],
        validate: [],
        display: [],
        behavior: [],
      };

      const schema = generateJSONSchema(ast);

      expect(schema.required).toContain('title');
      expect(schema.required).not.toContain('description');
    });

    it('应该支持 default 修饰符', () => {
      const ast: EventTypeAST = {
        type: 'test',
        name: '测试',
        fields: [
          { name: 'priority', type: { type: 'enum', values: ['low', 'normal', 'high'] }, default: 'normal' },
        ],
        validate: [],
        display: [],
        behavior: [],
      };

      const schema = generateJSONSchema(ast);

      expect(schema.properties?.priority.default).toBe('normal');
    });

    it('应该支持 min 修饰符（数组）', () => {
      const ast: EventTypeAST = {
        type: 'test',
        name: '测试',
        fields: [
          { name: 'attendees', type: { type: 'list', itemType: 'email' }, min: 1 },
        ],
        validate: [],
        display: [],
        behavior: [],
      };

      const schema = generateJSONSchema(ast);

      expect(schema.properties?.attendees.minItems).toBe(1);
    });

    it('应该支持 max 修饰符（数组）', () => {
      const ast: EventTypeAST = {
        type: 'test',
        name: '测试',
        fields: [
          { name: 'attendees', type: { type: 'list', itemType: 'email' }, max: 50 },
        ],
        validate: [],
        display: [],
        behavior: [],
      };

      const schema = generateJSONSchema(ast);

      expect(schema.properties?.attendees.maxItems).toBe(50);
    });

    it('应该支持 min 修饰符（数字）', () => {
      const ast: EventTypeAST = {
        type: 'test',
        name: '测试',
        fields: [
          { name: 'count', type: 'number', min: 0 },
        ],
        validate: [],
        display: [],
        behavior: [],
      };

      const schema = generateJSONSchema(ast);

      expect(schema.properties?.count.minimum).toBe(0);
    });

    it('应该支持 max 修饰符（数字）', () => {
      const ast: EventTypeAST = {
        type: 'test',
        name: '测试',
        fields: [
          { name: 'count', type: 'number', max: 100 },
        ],
        validate: [],
        display: [],
        behavior: [],
      };

      const schema = generateJSONSchema(ast);

      expect(schema.properties?.count.maximum).toBe(100);
    });

    it('应该支持 min 修饰符（字符串）', () => {
      const ast: EventTypeAST = {
        type: 'test',
        name: '测试',
        fields: [
          { name: 'title', type: 'string', min: 1 },
        ],
        validate: [],
        display: [],
        behavior: [],
      };

      const schema = generateJSONSchema(ast);

      expect(schema.properties?.title.minLength).toBe(1);
    });

    it('应该支持 max 修饰符（字符串）', () => {
      const ast: EventTypeAST = {
        type: 'test',
        name: '测试',
        fields: [
          { name: 'title', type: 'string', max: 100 },
        ],
        validate: [],
        display: [],
        behavior: [],
      };

      const schema = generateJSONSchema(ast);

      expect(schema.properties?.title.maxLength).toBe(100);
    });
  });

  describe('完整示例', () => {
    it('应该生成完整的 meeting 类型 Schema', () => {
      const ast: EventTypeAST = {
        type: 'meeting',
        name: '会议',
        description: '团队会议、客户会议等',
        fields: [
          { name: 'title', type: 'string', required: true },
          { name: 'attendees', type: { type: 'list', itemType: 'email' }, required: true, min: 1, max: 50 },
          { name: 'location', type: 'string', required: false },
          { name: 'priority', type: { type: 'enum', values: ['low', 'normal', 'high'] }, default: 'normal' },
        ],
        validate: [],
        display: [],
        behavior: [],
      };

      const schema = generateJSONSchema(ast);

      expect(schema).toEqual({
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        title: '会议',
        description: '团队会议、客户会议等',
        properties: {
          title: {
            type: 'string',
          },
          attendees: {
            type: 'array',
            items: {
              type: 'string',
              format: 'email',
            },
            minItems: 1,
            maxItems: 50,
          },
          location: {
            type: 'string',
          },
          priority: {
            type: 'string',
            enum: ['low', 'normal', 'high'],
            default: 'normal',
          },
        },
        required: ['title', 'attendees'],
        additionalProperties: false,
      });
    });
  });

  describe('选项', () => {
    it('应该支持 includeSchema 选项', () => {
      const ast: EventTypeAST = {
        type: 'test',
        name: '测试',
        fields: [],
        validate: [],
        display: [],
        behavior: [],
      };

      const schemaWithSchema = generateJSONSchema(ast, { includeSchema: true });
      expect(schemaWithSchema.$schema).toBeDefined();

      const schemaWithoutSchema = generateJSONSchema(ast, { includeSchema: false });
      expect(schemaWithoutSchema.$schema).toBeUndefined();
    });

    it('应该支持 includeTitle 选项', () => {
      const ast: EventTypeAST = {
        type: 'test',
        name: '测试',
        fields: [],
        validate: [],
        display: [],
        behavior: [],
      };

      const schemaWithTitle = generateJSONSchema(ast, { includeTitle: true });
      expect(schemaWithTitle.title).toBe('测试');

      const schemaWithoutTitle = generateJSONSchema(ast, { includeTitle: false });
      expect(schemaWithoutTitle.title).toBeUndefined();
    });

    it('应该支持 includeDescription 选项', () => {
      const ast: EventTypeAST = {
        type: 'test',
        name: '测试',
        description: '测试描述',
        fields: [],
        validate: [],
        display: [],
        behavior: [],
      };

      const schemaWithDescription = generateJSONSchema(ast, { includeDescription: true });
      expect(schemaWithDescription.description).toBe('测试描述');

      const schemaWithoutDescription = generateJSONSchema(ast, { includeDescription: false });
      expect(schemaWithoutDescription.description).toBeUndefined();
    });
  });

  describe('边界情况', () => {
    it('应该正确处理空字段列表', () => {
      const ast: EventTypeAST = {
        type: 'test',
        name: '测试',
        fields: [],
        validate: [],
        display: [],
        behavior: [],
      };

      const schema = generateJSONSchema(ast);

      expect(schema.properties).toEqual({});
      expect(schema.required).toBeUndefined();
    });

    it('应该正确处理没有 description 的 AST', () => {
      const ast: EventTypeAST = {
        type: 'test',
        name: '测试',
        fields: [
          { name: 'title', type: 'string', required: true },
        ],
        validate: [],
        display: [],
        behavior: [],
      };

      const schema = generateJSONSchema(ast);

      expect(schema.description).toBeUndefined();
      expect(schema.title).toBe('测试');
    });
  });
});

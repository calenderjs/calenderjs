import { describe, it, expect } from 'vitest';
import type {
  EventTypeAST,
  FieldDefinition,
  FieldType,
  ValidationRule,
  BetweenRule,
  ComparisonRule,
  ConflictRule,
  WhenRule,
  LogicalRule,
  FieldAccess,
  DisplayRule,
  ConditionalValue,
  TemplateValue,
  BehaviorRule,
  ConstraintRule,
} from '../types';

describe('AST Types', () => {
  describe('EventTypeAST', () => {
    it('should create a valid EventTypeAST', () => {
      const ast: EventTypeAST = {
        type: 'meeting',
        name: '会议',
        fields: [],
        validate: [],
        display: [],
        behavior: [],
      };

      expect(ast.type).toBe('meeting');
      expect(ast.name).toBe('会议');
      expect(ast.fields).toEqual([]);
      expect(ast.validate).toEqual([]);
      expect(ast.display).toEqual([]);
      expect(ast.behavior).toEqual([]);
    });

    it('should support optional description', () => {
      const ast: EventTypeAST = {
        type: 'meeting',
        name: '会议',
        description: '团队会议',
        fields: [],
        validate: [],
        display: [],
        behavior: [],
      };

      expect(ast.description).toBe('团队会议');
    });

    it('should support optional constraints', () => {
      const ast: EventTypeAST = {
        type: 'meeting',
        name: '会议',
        fields: [],
        validate: [],
        display: [],
        behavior: [],
        constraints: [],
      };

      expect(ast.constraints).toEqual([]);
    });
  });

  describe('FieldDefinition', () => {
    it('should create a valid FieldDefinition', () => {
      const field: FieldDefinition = {
        name: 'title',
        type: 'string',
      };

      expect(field.name).toBe('title');
      expect(field.type).toBe('string');
    });

    it('should support optional modifiers', () => {
      const field: FieldDefinition = {
        name: 'title',
        type: 'string',
        required: true,
        default: 'Default Title',
        min: 1,
        max: 100,
      };

      expect(field.required).toBe(true);
      expect(field.default).toBe('Default Title');
      expect(field.min).toBe(1);
      expect(field.max).toBe(100);
    });
  });

  describe('FieldType', () => {
    it('should support primitive types', () => {
      const stringType: FieldType = 'string';
      const numberType: FieldType = 'number';
      const booleanType: FieldType = 'boolean';
      const emailType: FieldType = 'email';
      const textType: FieldType = 'text';

      expect(stringType).toBe('string');
      expect(numberType).toBe('number');
      expect(booleanType).toBe('boolean');
      expect(emailType).toBe('email');
      expect(textType).toBe('text');
    });

    it('should support list type', () => {
      const listType: FieldType = {
        type: 'list',
        itemType: 'string',
      };

      expect(listType.type).toBe('list');
      expect(listType.itemType).toBe('string');
    });

    it('should support enum type', () => {
      const enumType: FieldType = {
        type: 'enum',
        values: ['low', 'normal', 'high'],
      };

      expect(enumType.type).toBe('enum');
      expect(enumType.values).toEqual(['low', 'normal', 'high']);
    });
  });

  describe('ValidationRule', () => {
    it('should support BetweenRule', () => {
      const rule: BetweenRule = {
        type: 'Between',
        field: {
          type: 'FieldAccess',
          path: ['attendees', 'count'],
        },
        min: 1,
        max: 50,
      };

      expect(rule.type).toBe('Between');
      expect(rule.field.path).toEqual(['attendees', 'count']);
      expect(rule.min).toBe(1);
      expect(rule.max).toBe(50);
    });

    it('should support ComparisonRule', () => {
      const rule: ComparisonRule = {
        type: 'Comparison',
        operator: '>',
        left: {
          type: 'FieldAccess',
          path: ['priority'],
        },
        right: 'high',
      };

      expect(rule.type).toBe('Comparison');
      expect(rule.operator).toBe('>');
    });

    it('should support ConflictRule', () => {
      const noConflictRule: ConflictRule = {
        type: 'NoConflict',
      };
      const conflictRule: ConflictRule = {
        type: 'Conflict',
      };

      expect(noConflictRule.type).toBe('NoConflict');
      expect(conflictRule.type).toBe('Conflict');
    });

    it('should support WhenRule', () => {
      const rule: WhenRule = {
        type: 'When',
        condition: {
          type: 'Comparison',
          operator: 'is',
          left: {
            type: 'FieldAccess',
            path: ['priority'],
          },
          right: 'high',
        },
        rules: [],
      };

      expect(rule.type).toBe('When');
      expect(rule.condition).toBeDefined();
      expect(rule.rules).toEqual([]);
    });

    it('should support LogicalRule', () => {
      const binaryRule: LogicalRule = {
        type: 'BinaryExpression',
        operator: 'and',
        left: {
          type: 'FieldAccess',
          path: ['user', 'role'],
        },
        right: {
          type: 'FieldAccess',
          path: ['event', 'priority'],
        },
      };

      const unaryRule: LogicalRule = {
        type: 'UnaryExpression',
        operator: 'not',
        argument: {
          type: 'FieldAccess',
          path: ['user', 'role'],
        },
      };

      expect(binaryRule.type).toBe('BinaryExpression');
      expect(binaryRule.operator).toBe('and');
      expect(unaryRule.type).toBe('UnaryExpression');
      expect(unaryRule.operator).toBe('not');
    });
  });

  describe('FieldAccess', () => {
    it('should create a valid FieldAccess', () => {
      const access: FieldAccess = {
        type: 'FieldAccess',
        path: ['user', 'email'],
      };

      expect(access.type).toBe('FieldAccess');
      expect(access.path).toEqual(['user', 'email']);
    });

    it('should support single path', () => {
      const access: FieldAccess = {
        type: 'FieldAccess',
        path: ['title'],
      };

      expect(access.path).toEqual(['title']);
    });

    it('should support nested path', () => {
      const access: FieldAccess = {
        type: 'FieldAccess',
        path: ['event', 'data', 'attendees', 'count'],
      };

      expect(access.path).toEqual(['event', 'data', 'attendees', 'count']);
    });
  });

  describe('DisplayRule', () => {
    it('should support string value', () => {
      const rule: DisplayRule = {
        name: 'color',
        value: '#4285f4',
      };

      expect(rule.name).toBe('color');
      expect(rule.value).toBe('#4285f4');
    });

    it('should support ConditionalValue', () => {
      const rule: DisplayRule = {
        name: 'color',
        value: {
          type: 'Conditional',
          condition: {
            type: 'FieldAccess',
            path: ['priority'],
          },
          consequent: '#ea4335',
          alternate: '#4285f4',
        },
      };

      expect(rule.value.type).toBe('Conditional');
    });

    it('should support TemplateValue', () => {
      const rule: DisplayRule = {
        name: 'title',
        value: {
          type: 'Template',
          parts: [
            'Meeting: ',
            {
              type: 'FieldAccess',
              path: ['title'],
            },
          ],
        },
      };

      expect(rule.value.type).toBe('Template');
      expect(rule.value.parts).toHaveLength(2);
    });
  });

  describe('BehaviorRule', () => {
    it('should support boolean value', () => {
      const rule: BehaviorRule = {
        name: 'draggable',
        value: true,
      };

      expect(rule.name).toBe('draggable');
      expect(rule.value).toBe(true);
    });

    it('should support expression value', () => {
      const rule: BehaviorRule = {
        name: 'editable',
        value: {
          type: 'Comparison',
          operator: 'is',
          left: {
            type: 'FieldAccess',
            path: ['user', 'role'],
          },
          right: 'admin',
        },
      };

      expect(rule.name).toBe('editable');
      expect(typeof rule.value).toBe('object');
    });
  });

  describe('ConstraintRule', () => {
    it('should create a valid ConstraintRule', () => {
      const rule: ConstraintRule = {
        name: 'minDuration',
        value: {
          type: 'Duration',
          value: 15,
          unit: 'minutes',
        },
      };

      expect(rule.name).toBe('minDuration');
      expect(rule.value).toBeDefined();
    });
  });
});

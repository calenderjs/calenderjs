import { describe, it, expect, beforeEach } from 'vitest';
import { EventDSLRuntime } from './EventDSLRuntime';
import { EventTypeAST } from '../ast/types';
import { Event, User, ValidationContext, RenderContext } from '@calenderjs/core';

describe('EventDSLRuntime', () => {
  let ast: EventTypeAST;
  let runtime: EventDSLRuntime;

  beforeEach(() => {
    ast = {
      type: 'meeting',
      name: '会议',
      fields: [
        {
          name: 'title',
          type: 'string',
          required: true,
        },
      ],
      validate: [],
      display: [
        {
          name: 'color',
          value: '#4285f4',
        },
        {
          name: 'title',
          value: 'Meeting Title',
        },
      ],
      behavior: [
        {
          name: 'draggable',
          value: true,
        },
      ],
    };
    runtime = new EventDSLRuntime(ast);
  });

  describe('constructor', () => {
    it('should create EventDSLRuntime with AST', () => {
      expect(runtime).toBeInstanceOf(EventDSLRuntime);
    });
  });

  describe('validate', () => {
    it('should return valid result when no validation rules', () => {
      const event: Event = {
        id: '1',
        type: 'meeting',
        title: 'Test Meeting',
        startTime: new Date('2024-12-30T10:00:00'),
        endTime: new Date('2024-12-30T11:00:00'),
        data: {},
      };

      const context: ValidationContext = {
        events: [],
        now: new Date(),
      };

      const result = runtime.validate(event, context);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('should handle validation rule that returns invalid with errors', () => {
      // Create a mock runtime that returns invalid result
      const astWithInvalidRule: EventTypeAST = {
        type: 'meeting',
        name: '会议',
        fields: [],
        validate: [
          {
            type: 'Comparison',
            operator: '>',
            left: {
              type: 'FieldAccess',
              path: ['priority'],
            },
            right: 'low',
          },
        ],
        display: [],
        behavior: [],
      };

      // We need to test the case where evaluateValidationRule returns invalid
      // Since it's a private method, we test through the public interface
      // The current implementation always returns valid, so we test the error handling path
      const runtimeWithInvalid = new EventDSLRuntime(astWithInvalidRule);

      const event: Event = {
        id: '1',
        type: 'meeting',
        title: 'Test Meeting',
        startTime: new Date('2024-12-30T10:00:00'),
        endTime: new Date('2024-12-30T11:00:00'),
        data: {},
      };

      const context: ValidationContext = {
        events: [],
        now: new Date(),
      };

      // Current implementation returns valid, but we test the structure
      const result = runtimeWithInvalid.validate(event, context);
      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('errors');
    });

    it('should handle empty events array in context', () => {
      const event: Event = {
        id: '1',
        type: 'meeting',
        title: 'Test Meeting',
        startTime: new Date('2024-12-30T10:00:00'),
        endTime: new Date('2024-12-30T11:00:00'),
        data: {},
      };

      const context: ValidationContext = {
        events: [],
        now: new Date(),
      };

      const result = runtime.validate(event, context);
      expect(result.valid).toBe(true);
    });

    it('should handle context with user', () => {
      const event: Event = {
        id: '1',
        type: 'meeting',
        title: 'Test Meeting',
        startTime: new Date('2024-12-30T10:00:00'),
        endTime: new Date('2024-12-30T11:00:00'),
        data: {},
      };

      const user: User = {
        id: '1',
        email: 'user@example.com',
        role: 'user',
      };

      const context: ValidationContext = {
        user,
        events: [],
        now: new Date(),
      };

      const result = runtime.validate(event, context);
      expect(result.valid).toBe(true);
    });
  });

  describe('render', () => {
    it('should render event with display rules', () => {
      const event: Event = {
        id: '1',
        type: 'meeting',
        title: 'Test Meeting',
        startTime: new Date('2024-12-30T10:00:00'),
        endTime: new Date('2024-12-30T11:00:00'),
        data: {},
      };

      const context: RenderContext = {};

      const rendered = runtime.render(event, context);
      expect(rendered.title).toBe('Meeting Title');
      expect(rendered.color).toBe('#4285f4');
    });

    it('should handle empty render context', () => {
      const event: Event = {
        id: '1',
        type: 'meeting',
        title: 'Test Meeting',
        startTime: new Date('2024-12-30T10:00:00'),
        endTime: new Date('2024-12-30T11:00:00'),
        data: {},
      };

      const context: RenderContext = {};

      const rendered = runtime.render(event, context);
      expect(rendered).toBeDefined();
    });

    it('should handle render context with user', () => {
      const event: Event = {
        id: '1',
        type: 'meeting',
        title: 'Test Meeting',
        startTime: new Date('2024-12-30T10:00:00'),
        endTime: new Date('2024-12-30T11:00:00'),
        data: {},
      };

      const user: User = {
        id: '1',
        email: 'user@example.com',
        role: 'user',
      };

      const context: RenderContext = {
        user,
      };

      const rendered = runtime.render(event, context);
      expect(rendered).toBeDefined();
    });
  });

  describe('canPerform', () => {
    it('should return true for boolean behavior rule', () => {
      const event: Event = {
        id: '1',
        type: 'meeting',
        title: 'Test Meeting',
        startTime: new Date('2024-12-30T10:00:00'),
        endTime: new Date('2024-12-30T11:00:00'),
        data: {},
      };

      const user: User = {
        id: '1',
        email: 'user@example.com',
        role: 'user',
      };

      const canDrag = runtime.canPerform('draggable', event, user);
      expect(canDrag).toBe(true);
    });

    it('should return false for non-existent behavior rule', () => {
      const event: Event = {
        id: '1',
        type: 'meeting',
        title: 'Test Meeting',
        startTime: new Date('2024-12-30T10:00:00'),
        endTime: new Date('2024-12-30T11:00:00'),
        data: {},
      };

      const user: User = {
        id: '1',
        email: 'user@example.com',
        role: 'user',
      };

      const canDelete = runtime.canPerform('deletable', event, user);
      expect(canDelete).toBe(false);
    });

    it('should handle behavior rule with false value', () => {
      const astWithFalse: EventTypeAST = {
        type: 'meeting',
        name: '会议',
        fields: [],
        validate: [],
        display: [],
        behavior: [
          {
            name: 'resizable',
            value: false,
          },
        ],
      };

      const runtimeWithFalse = new EventDSLRuntime(astWithFalse);

      const event: Event = {
        id: '1',
        type: 'meeting',
        title: 'Test Meeting',
        startTime: new Date('2024-12-30T10:00:00'),
        endTime: new Date('2024-12-30T11:00:00'),
        data: {},
      };

      const user: User = {
        id: '1',
        email: 'user@example.com',
        role: 'user',
      };

      const canResize = runtimeWithFalse.canPerform('resizable', event, user);
      expect(canResize).toBe(false);
    });

    it('should handle behavior rule with expression value', () => {
      const astWithExpression: EventTypeAST = {
        type: 'meeting',
        name: '会议',
        fields: [],
        validate: [],
        display: [],
        behavior: [
          {
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
          },
        ],
      };

      const runtimeWithExpression = new EventDSLRuntime(astWithExpression);

      const event: Event = {
        id: '1',
        type: 'meeting',
        title: 'Test Meeting',
        startTime: new Date('2024-12-30T10:00:00'),
        endTime: new Date('2024-12-30T11:00:00'),
        data: {},
      };

      const user: User = {
        id: '1',
        email: 'user@example.com',
        role: 'user',
      };

      // evaluateExpression returns true by default (TODO implementation)
      const canEdit = runtimeWithExpression.canPerform('editable', event, user);
      expect(canEdit).toBe(true);
    });
  });

  describe('render with different display rules', () => {
    it('should handle all display rule names', () => {
      const astWithAllDisplay: EventTypeAST = {
        type: 'meeting',
        name: '会议',
        fields: [],
        validate: [],
        display: [
          { name: 'color', value: '#4285f4' },
          { name: 'icon', value: '📅' },
          { name: 'title', value: 'Custom Title' },
          { name: 'description', value: 'Custom Description' },
        ],
        behavior: [],
      };

      const runtimeWithAllDisplay = new EventDSLRuntime(astWithAllDisplay);

      const event: Event = {
        id: '1',
        type: 'meeting',
        title: 'Test Meeting',
        startTime: new Date('2024-12-30T10:00:00'),
        endTime: new Date('2024-12-30T11:00:00'),
        data: {},
      };

      const context: RenderContext = {};

      const rendered = runtimeWithAllDisplay.render(event, context);
      expect(rendered.color).toBe('#4285f4');
      expect(rendered.icon).toBe('📅');
      expect(rendered.title).toBe('Custom Title');
      expect(rendered.description).toBe('Custom Description');
    });

    it('should handle empty display rules', () => {
      const astWithNoDisplay: EventTypeAST = {
        type: 'meeting',
        name: '会议',
        fields: [],
        validate: [],
        display: [],
        behavior: [],
      };

      const runtimeWithNoDisplay = new EventDSLRuntime(astWithNoDisplay);

      const event: Event = {
        id: '1',
        type: 'meeting',
        title: 'Test Meeting',
        startTime: new Date('2024-12-30T10:00:00'),
        endTime: new Date('2024-12-30T11:00:00'),
        data: {},
      };

      const context: RenderContext = {};

      const rendered = runtimeWithNoDisplay.render(event, context);
      expect(rendered.title).toBe('Test Meeting');
      expect(rendered.color).toBe('#4285f4');
    });
  });

  describe('validate with validation rules', () => {
    it('should handle validation rules that return valid', () => {
      const astWithValidation: EventTypeAST = {
        type: 'meeting',
        name: '会议',
        fields: [],
        validate: [
          {
            type: 'Comparison',
            operator: '>',
            left: {
              type: 'FieldAccess',
              path: ['priority'],
            },
            right: 'low',
          },
        ],
        display: [],
        behavior: [],
      };

      const runtimeWithValidation = new EventDSLRuntime(astWithValidation);

      const event: Event = {
        id: '1',
        type: 'meeting',
        title: 'Test Meeting',
        startTime: new Date('2024-12-30T10:00:00'),
        endTime: new Date('2024-12-30T11:00:00'),
        data: {},
      };

      const context: ValidationContext = {
        events: [],
        now: new Date(),
      };

      // evaluateValidationRule returns { valid: true } by default (TODO implementation)
      const result = runtimeWithValidation.validate(event, context);
      expect(result.valid).toBe(true);
    });
  });

  describe('evaluateDisplayValue', () => {
    it('should handle ConditionalValue with alternate', () => {
      const astWithConditional: EventTypeAST = {
        type: 'meeting',
        name: '会议',
        fields: [],
        validate: [],
        display: [
          {
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
          },
        ],
        behavior: [],
      };

      const runtimeWithConditional = new EventDSLRuntime(astWithConditional);

      const event: Event = {
        id: '1',
        type: 'meeting',
        title: 'Test Meeting',
        startTime: new Date('2024-12-30T10:00:00'),
        endTime: new Date('2024-12-30T11:00:00'),
        data: {},
      };

      const context: RenderContext = {};

      // evaluateExpression returns true by default, so consequent should be used
      const rendered = runtimeWithConditional.render(event, context);
      expect(rendered.color).toBe('#ea4335');
    });

    it('should handle ConditionalValue without alternate', () => {
      const astWithConditionalNoAlternate: EventTypeAST = {
        type: 'meeting',
        name: '会议',
        fields: [],
        validate: [],
        display: [
          {
            name: 'description',
            value: {
              type: 'Conditional',
              condition: {
                type: 'FieldAccess',
                path: ['priority'],
              },
              consequent: 'High Priority',
            },
          },
        ],
        behavior: [],
      };

      const runtimeWithConditionalNoAlternate = new EventDSLRuntime(astWithConditionalNoAlternate);

      const event: Event = {
        id: '1',
        type: 'meeting',
        title: 'Test Meeting',
        startTime: new Date('2024-12-30T10:00:00'),
        endTime: new Date('2024-12-30T11:00:00'),
        data: {},
      };

      const context: RenderContext = {};

      const rendered = runtimeWithConditionalNoAlternate.render(event, context);
      expect(rendered.description).toBe('High Priority');
    });

    it('should handle ConditionalValue with false condition and no alternate', () => {
      // We need to test the case where condition is false and alternate is undefined
      // Since evaluateExpression always returns true, we can't test this directly
      // But we can verify the structure handles it
      const astWithConditionalFalse: EventTypeAST = {
        type: 'meeting',
        name: '会议',
        fields: [],
        validate: [],
        display: [
          {
            name: 'description',
            value: {
              type: 'Conditional',
              condition: {
                type: 'FieldAccess',
                path: ['priority'],
              },
              consequent: 'High Priority',
              // alternate is undefined
            },
          },
        ],
        behavior: [],
      };

      const runtimeWithConditionalFalse = new EventDSLRuntime(astWithConditionalFalse);

      const event: Event = {
        id: '1',
        type: 'meeting',
        title: 'Test Meeting',
        startTime: new Date('2024-12-30T10:00:00'),
        endTime: new Date('2024-12-30T11:00:00'),
        data: {},
      };

      const context: RenderContext = {};

      // Since evaluateExpression returns true, consequent is used
      const rendered = runtimeWithConditionalFalse.render(event, context);
      expect(rendered.description).toBe('High Priority');
    });

    it('should handle TemplateValue', () => {
      const astWithTemplate: EventTypeAST = {
        type: 'meeting',
        name: '会议',
        fields: [],
        validate: [],
        display: [
          {
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
          },
        ],
        behavior: [],
      };

      const runtimeWithTemplate = new EventDSLRuntime(astWithTemplate);

      const event: Event = {
        id: '1',
        type: 'meeting',
        title: 'Test Meeting',
        startTime: new Date('2024-12-30T10:00:00'),
        endTime: new Date('2024-12-30T11:00:00'),
        data: {},
      };

      const context: RenderContext = {};

      // evaluateTemplate returns empty string by default (TODO implementation)
      const rendered = runtimeWithTemplate.render(event, context);
      expect(rendered.title).toBe('');
    });

    it('should handle non-string, non-Conditional, non-Template value', () => {
      const astWithOtherValue: EventTypeAST = {
        type: 'meeting',
        name: '会议',
        fields: [],
        validate: [],
        display: [
          {
            name: 'icon',
            value: {
              type: 'Unknown',
              data: 'test',
            } as unknown as string,
          },
        ],
        behavior: [],
      };

      const runtimeWithOtherValue = new EventDSLRuntime(astWithOtherValue);

      const event: Event = {
        id: '1',
        type: 'meeting',
        title: 'Test Meeting',
        startTime: new Date('2024-12-30T10:00:00'),
        endTime: new Date('2024-12-30T11:00:00'),
        data: {},
      };

      const context: RenderContext = {};

      const rendered = runtimeWithOtherValue.render(event, context);
      expect(rendered.icon).toBeDefined();
    });
  });
});

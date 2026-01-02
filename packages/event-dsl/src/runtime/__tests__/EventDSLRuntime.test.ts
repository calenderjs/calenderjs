import { describe, it, expect, beforeEach } from 'vitest';
import { EventDSLRuntime } from '../EventDSLRuntime';
import { EventTypeAST } from '../../ast/types';
import type { Event } from '@calenderjs/event-model';
import { User, ValidationContext, RenderContext } from '@calenderjs/core';

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

    it('should validate Between rule - valid case', () => {
      const astWithBetween: EventTypeAST = {
        type: 'meeting',
        name: '会议',
        fields: [],
        validate: [
          {
            type: 'Between',
            field: {
              type: 'FieldAccess',
              path: ['data', 'priority'],
            },
            min: 1,
            max: 10,
          },
        ],
        display: [],
        behavior: [],
      };

      const runtimeWithBetween = new EventDSLRuntime(astWithBetween);

      const event: Event = {
        id: '1',
        type: 'meeting',
        title: 'Test Meeting',
        startTime: new Date('2024-12-30T10:00:00'),
        endTime: new Date('2024-12-30T11:00:00'),
        data: {
          priority: 5,
        },
      };

      const context: ValidationContext = {
        events: [],
        now: new Date(),
      };

      const result = runtimeWithBetween.validate(event, context);
      expect(result.valid).toBe(true);
    });

    it('should validate Between rule - invalid case (too low)', () => {
      const astWithBetween: EventTypeAST = {
        type: 'meeting',
        name: '会议',
        fields: [],
        validate: [
          {
            type: 'Between',
            field: {
              type: 'FieldAccess',
              path: ['priority'],
            },
            min: 1,
            max: 10,
          },
        ],
        display: [],
        behavior: [],
      };

      const runtimeWithBetween = new EventDSLRuntime(astWithBetween);

      const event: Event = {
        id: '1',
        type: 'meeting',
        title: 'Test Meeting',
        startTime: new Date('2024-12-30T10:00:00'),
        endTime: new Date('2024-12-30T11:00:00'),
        data: {
          priority: 0,
        },
      };

      const context: ValidationContext = {
        events: [],
        now: new Date(),
      };

      const result = runtimeWithBetween.validate(event, context);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.length).toBeGreaterThan(0);
    });

    it('should validate Between rule - invalid case (too high)', () => {
      const astWithBetween: EventTypeAST = {
        type: 'meeting',
        name: '会议',
        fields: [],
        validate: [
          {
            type: 'Between',
            field: {
              type: 'FieldAccess',
              path: ['priority'],
            },
            min: 1,
            max: 10,
          },
        ],
        display: [],
        behavior: [],
      };

      const runtimeWithBetween = new EventDSLRuntime(astWithBetween);

      const event: Event = {
        id: '1',
        type: 'meeting',
        title: 'Test Meeting',
        startTime: new Date('2024-12-30T10:00:00'),
        endTime: new Date('2024-12-30T11:00:00'),
        data: {
          priority: 15,
        },
      };

      const context: ValidationContext = {
        events: [],
        now: new Date(),
      };

      const result = runtimeWithBetween.validate(event, context);
      expect(result.valid).toBe(false);
    });

    it('should validate Between rule - undefined field', () => {
      const astWithBetween: EventTypeAST = {
        type: 'meeting',
        name: '会议',
        fields: [],
        validate: [
          {
            type: 'Between',
            field: {
              type: 'FieldAccess',
              path: ['priority'],
            },
            min: 1,
            max: 10,
          },
        ],
        display: [],
        behavior: [],
      };

      const runtimeWithBetween = new EventDSLRuntime(astWithBetween);

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

      const result = runtimeWithBetween.validate(event, context);
      expect(result.valid).toBe(false);
    });

    it('should validate Comparison rule - equals operator', () => {
      const astWithComparison: EventTypeAST = {
        type: 'meeting',
        name: '会议',
        fields: [],
        validate: [
          {
            type: 'Comparison',
            operator: 'equals',
            left: {
              type: 'FieldAccess',
              path: ['data', 'status'],
            },
            right: 'active',
          },
        ],
        display: [],
        behavior: [],
      };

      const runtimeWithComparison = new EventDSLRuntime(astWithComparison);

      const event: Event = {
        id: '1',
        type: 'meeting',
        title: 'Test Meeting',
        startTime: new Date('2024-12-30T10:00:00'),
        endTime: new Date('2024-12-30T11:00:00'),
        data: {
          status: 'active',
        },
      };

      const context: ValidationContext = {
        events: [],
        now: new Date(),
      };

      const result = runtimeWithComparison.validate(event, context);
      expect(result.valid).toBe(true);
    });

    it('should validate Comparison rule - not equals operator', () => {
      const astWithComparison: EventTypeAST = {
        type: 'meeting',
        name: '会议',
        fields: [],
        validate: [
          {
            type: 'Comparison',
            operator: 'not equals',
            left: {
              type: 'FieldAccess',
              path: ['status'],
            },
            right: 'cancelled',
          },
        ],
        display: [],
        behavior: [],
      };

      const runtimeWithComparison = new EventDSLRuntime(astWithComparison);

      const event: Event = {
        id: '1',
        type: 'meeting',
        title: 'Test Meeting',
        startTime: new Date('2024-12-30T10:00:00'),
        endTime: new Date('2024-12-30T11:00:00'),
        data: {
          status: 'active',
        },
      };

      const context: ValidationContext = {
        events: [],
        now: new Date(),
      };

      const result = runtimeWithComparison.validate(event, context);
      expect(result.valid).toBe(true);
    });

    it('should validate Comparison rule - greater than operator', () => {
      const astWithComparison: EventTypeAST = {
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
            right: 5,
          },
        ],
        display: [],
        behavior: [],
      };

      const runtimeWithComparison = new EventDSLRuntime(astWithComparison);

      const event: Event = {
        id: '1',
        type: 'meeting',
        title: 'Test Meeting',
        startTime: new Date('2024-12-30T10:00:00'),
        endTime: new Date('2024-12-30T11:00:00'),
        data: {
          priority: 8,
        },
      };

      const context: ValidationContext = {
        events: [],
        now: new Date(),
      };

      const result = runtimeWithComparison.validate(event, context);
      expect(result.valid).toBe(true);
    });

    it('should validate Comparison rule - less than operator', () => {
      const astWithComparison: EventTypeAST = {
        type: 'meeting',
        name: '会议',
        fields: [],
        validate: [
          {
            type: 'Comparison',
            operator: '<',
            left: {
              type: 'FieldAccess',
              path: ['priority'],
            },
            right: 5,
          },
        ],
        display: [],
        behavior: [],
      };

      const runtimeWithComparison = new EventDSLRuntime(astWithComparison);

      const event: Event = {
        id: '1',
        type: 'meeting',
        title: 'Test Meeting',
        startTime: new Date('2024-12-30T10:00:00'),
        endTime: new Date('2024-12-30T11:00:00'),
        data: {
          priority: 3,
        },
      };

      const context: ValidationContext = {
        events: [],
        now: new Date(),
      };

      const result = runtimeWithComparison.validate(event, context);
      expect(result.valid).toBe(true);
    });

    it('should validate NoConflict rule - no conflict', () => {
      const astWithNoConflict: EventTypeAST = {
        type: 'meeting',
        name: '会议',
        fields: [],
        validate: [
          {
            type: 'NoConflict',
          },
        ],
        display: [],
        behavior: [],
      };

      const runtimeWithNoConflict = new EventDSLRuntime(astWithNoConflict);

      const event: Event = {
        id: '1',
        type: 'meeting',
        title: 'Test Meeting',
        startTime: new Date('2024-12-30T10:00:00'),
        endTime: new Date('2024-12-30T11:00:00'),
        data: {},
      };

      const otherEvent: Event = {
        id: '2',
        type: 'meeting',
        title: 'Other Meeting',
        startTime: new Date('2024-12-30T14:00:00'),
        endTime: new Date('2024-12-30T15:00:00'),
        data: {},
      };

      const context: ValidationContext = {
        events: [otherEvent],
        now: new Date(),
      };

      const result = runtimeWithNoConflict.validate(event, context);
      expect(result.valid).toBe(true);
    });

    it('should validate NoConflict rule - has conflict', () => {
      const astWithNoConflict: EventTypeAST = {
        type: 'meeting',
        name: '会议',
        fields: [],
        validate: [
          {
            type: 'NoConflict',
          },
        ],
        display: [],
        behavior: [],
      };

      const runtimeWithNoConflict = new EventDSLRuntime(astWithNoConflict);

      const event: Event = {
        id: '1',
        type: 'meeting',
        title: 'Test Meeting',
        startTime: new Date('2024-12-30T10:00:00'),
        endTime: new Date('2024-12-30T11:00:00'),
        data: {},
      };

      const otherEvent: Event = {
        id: '2',
        type: 'meeting',
        title: 'Other Meeting',
        startTime: new Date('2024-12-30T10:30:00'),
        endTime: new Date('2024-12-30T11:30:00'),
        data: {},
      };

      const context: ValidationContext = {
        events: [otherEvent],
        now: new Date(),
      };

      const result = runtimeWithNoConflict.validate(event, context);
      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should validate Conflict rule - has conflict', () => {
      const astWithConflict: EventTypeAST = {
        type: 'meeting',
        name: '会议',
        fields: [],
        validate: [
          {
            type: 'Conflict',
          },
        ],
        display: [],
        behavior: [],
      };

      const runtimeWithConflict = new EventDSLRuntime(astWithConflict);

      const event: Event = {
        id: '1',
        type: 'meeting',
        title: 'Test Meeting',
        startTime: new Date('2024-12-30T10:00:00'),
        endTime: new Date('2024-12-30T11:00:00'),
        data: {},
      };

      const otherEvent: Event = {
        id: '2',
        type: 'meeting',
        title: 'Other Meeting',
        startTime: new Date('2024-12-30T10:30:00'),
        endTime: new Date('2024-12-30T11:30:00'),
        data: {},
      };

      const context: ValidationContext = {
        events: [otherEvent],
        now: new Date(),
      };

      const result = runtimeWithConflict.validate(event, context);
      expect(result.valid).toBe(true);
    });

    it('should validate Conflict rule - no conflict', () => {
      const astWithConflict: EventTypeAST = {
        type: 'meeting',
        name: '会议',
        fields: [],
        validate: [
          {
            type: 'Conflict',
          },
        ],
        display: [],
        behavior: [],
      };

      const runtimeWithConflict = new EventDSLRuntime(astWithConflict);

      const event: Event = {
        id: '1',
        type: 'meeting',
        title: 'Test Meeting',
        startTime: new Date('2024-12-30T10:00:00'),
        endTime: new Date('2024-12-30T11:00:00'),
        data: {},
      };

      const otherEvent: Event = {
        id: '2',
        type: 'meeting',
        title: 'Other Meeting',
        startTime: new Date('2024-12-30T14:00:00'),
        endTime: new Date('2024-12-30T15:00:00'),
        data: {},
      };

      const context: ValidationContext = {
        events: [otherEvent],
        now: new Date(),
      };

      const result = runtimeWithConflict.validate(event, context);
      expect(result.valid).toBe(false);
    });

    it('should validate When rule - condition true', () => {
      const astWithWhen: EventTypeAST = {
        type: 'meeting',
        name: '会议',
        fields: [],
        validate: [
          {
            type: 'When',
            condition: {
              type: 'Comparison',
              operator: 'is',
              left: {
                type: 'FieldAccess',
                path: ['status'],
              },
              right: 'active',
            },
            rules: [
              {
                type: 'Comparison',
                operator: '>',
                left: {
                  type: 'FieldAccess',
                  path: ['priority'],
                },
                right: 5,
              },
            ],
          },
        ],
        display: [],
        behavior: [],
      };

      const runtimeWithWhen = new EventDSLRuntime(astWithWhen);

      const event: Event = {
        id: '1',
        type: 'meeting',
        title: 'Test Meeting',
        startTime: new Date('2024-12-30T10:00:00'),
        endTime: new Date('2024-12-30T11:00:00'),
        data: {
          status: 'active',
          priority: 8,
        },
      };

      const context: ValidationContext = {
        events: [],
        now: new Date(),
      };

      const result = runtimeWithWhen.validate(event, context);
      expect(result.valid).toBe(true);
    });

    it('should validate When rule - condition false', () => {
      const astWithWhen: EventTypeAST = {
        type: 'meeting',
        name: '会议',
        fields: [],
        validate: [
          {
            type: 'When',
            condition: {
              type: 'Comparison',
              operator: 'is',
              left: {
                type: 'FieldAccess',
                path: ['status'],
              },
              right: 'active',
            },
            rules: [
              {
                type: 'Comparison',
                operator: '>',
                left: {
                  type: 'FieldAccess',
                  path: ['priority'],
                },
                right: 5,
              },
            ],
          },
        ],
        display: [],
        behavior: [],
      };

      const runtimeWithWhen = new EventDSLRuntime(astWithWhen);

      const event: Event = {
        id: '1',
        type: 'meeting',
        title: 'Test Meeting',
        startTime: new Date('2024-12-30T10:00:00'),
        endTime: new Date('2024-12-30T11:00:00'),
        data: {
          status: 'inactive',
          priority: 8,
        },
      };

      const context: ValidationContext = {
        events: [],
        now: new Date(),
      };

      const result = runtimeWithWhen.validate(event, context);
      expect(result.valid).toBe(true); // When condition is false, rules are skipped
    });

    it('should validate BinaryExpression rule - and operator', () => {
      const astWithBinary: EventTypeAST = {
        type: 'meeting',
        name: '会议',
        fields: [],
        validate: [
          {
            type: 'BinaryExpression',
            operator: 'and',
            left: {
              type: 'Comparison',
              operator: 'is',
              left: {
                type: 'FieldAccess',
                path: ['status'],
              },
              right: 'active',
            },
            right: {
              type: 'Comparison',
              operator: '>',
              left: {
                type: 'FieldAccess',
                path: ['priority'],
              },
              right: 5,
            },
          },
        ],
        display: [],
        behavior: [],
      };

      const runtimeWithBinary = new EventDSLRuntime(astWithBinary);

      const event: Event = {
        id: '1',
        type: 'meeting',
        title: 'Test Meeting',
        startTime: new Date('2024-12-30T10:00:00'),
        endTime: new Date('2024-12-30T11:00:00'),
        data: {
          status: 'active',
          priority: 8,
        },
      };

      const context: ValidationContext = {
        events: [],
        now: new Date(),
      };

      const result = runtimeWithBinary.validate(event, context);
      expect(result.valid).toBe(true);
    });

    it('should validate BinaryExpression rule - or operator', () => {
      const astWithBinary: EventTypeAST = {
        type: 'meeting',
        name: '会议',
        fields: [],
        validate: [
          {
            type: 'BinaryExpression',
            operator: 'or',
            left: {
              type: 'Comparison',
              operator: 'is',
              left: {
                type: 'FieldAccess',
                path: ['status'],
              },
              right: 'active',
            },
            right: {
              type: 'Comparison',
              operator: 'is',
              left: {
                type: 'FieldAccess',
                path: ['status'],
              },
              right: 'pending',
            },
          },
        ],
        display: [],
        behavior: [],
      };

      const runtimeWithBinary = new EventDSLRuntime(astWithBinary);

      const event: Event = {
        id: '1',
        type: 'meeting',
        title: 'Test Meeting',
        startTime: new Date('2024-12-30T10:00:00'),
        endTime: new Date('2024-12-30T11:00:00'),
        data: {
          status: 'pending',
        },
      };

      const context: ValidationContext = {
        events: [],
        now: new Date(),
      };

      const result = runtimeWithBinary.validate(event, context);
      expect(result.valid).toBe(true);
    });

    it('should validate UnaryExpression rule - not operator', () => {
      const astWithUnary: EventTypeAST = {
        type: 'meeting',
        name: '会议',
        fields: [],
        validate: [
          {
            type: 'UnaryExpression',
            operator: 'not',
            argument: {
              type: 'Comparison',
              operator: 'is',
              left: {
                type: 'FieldAccess',
                path: ['status'],
              },
              right: 'cancelled',
            },
          },
        ],
        display: [],
        behavior: [],
      };

      const runtimeWithUnary = new EventDSLRuntime(astWithUnary);

      const event: Event = {
        id: '1',
        type: 'meeting',
        title: 'Test Meeting',
        startTime: new Date('2024-12-30T10:00:00'),
        endTime: new Date('2024-12-30T11:00:00'),
        data: {
          status: 'active',
        },
      };

      const context: ValidationContext = {
        events: [],
        now: new Date(),
      };

      const result = runtimeWithUnary.validate(event, context);
      expect(result.valid).toBe(true);
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

    it('should accumulate errors from multiple validation rules', () => {
      const astWithMultiple: EventTypeAST = {
        type: 'meeting',
        name: '会议',
        fields: [],
        validate: [
          {
            type: 'Comparison',
            operator: 'is',
            left: {
              type: 'FieldAccess',
              path: ['status'],
            },
            right: 'active',
          },
          {
            type: 'Between',
            field: {
              type: 'FieldAccess',
              path: ['priority'],
            },
            min: 1,
            max: 10,
          },
        ],
        display: [],
        behavior: [],
      };

      const runtimeWithMultiple = new EventDSLRuntime(astWithMultiple);

      const event: Event = {
        id: '1',
        type: 'meeting',
        title: 'Test Meeting',
        startTime: new Date('2024-12-30T10:00:00'),
        endTime: new Date('2024-12-30T11:00:00'),
        data: {
          status: 'inactive',
          priority: 15,
        },
      };

      const context: ValidationContext = {
        events: [],
        now: new Date(),
      };

      const result = runtimeWithMultiple.validate(event, context);
      expect(result.valid).toBe(false);
      expect(result.errors?.length).toBeGreaterThan(0);
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

    it('should handle ConditionalValue with true condition', () => {
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
        data: {
          priority: 8,
        },
      };

      const context: RenderContext = {};

      const rendered = runtimeWithConditional.render(event, context);
      expect(rendered.color).toBe('#ea4335');
    });

    it('should handle ConditionalValue with false condition and alternate', () => {
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
                type: 'Comparison',
                operator: 'is',
                left: {
                  type: 'FieldAccess',
                  path: ['status'],
                },
                right: 'active',
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
        data: {
          status: 'inactive',
        },
      };

      const context: RenderContext = {};

      const rendered = runtimeWithConditional.render(event, context);
      expect(rendered.color).toBe('#4285f4');
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
        data: {
          priority: 8,
        },
      };

      const context: RenderContext = {};

      const rendered = runtimeWithConditionalNoAlternate.render(event, context);
      expect(rendered.description).toBe('High Priority');
    });

    it('should handle ConditionalValue with false condition and no alternate', () => {
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
                type: 'Comparison',
                operator: 'is',
                left: {
                  type: 'FieldAccess',
                  path: ['status'],
                },
                right: 'active',
              },
              consequent: 'High Priority',
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
        data: {
          status: 'inactive',
        },
      };

      const context: RenderContext = {};

      const rendered = runtimeWithConditionalFalse.render(event, context);
      expect(rendered.description).toBe('');
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

      const rendered = runtimeWithTemplate.render(event, context);
      expect(rendered.title).toBe('Meeting: Test Meeting');
    });

    it('should handle TemplateValue with nested field access', () => {
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
                'Priority ',
                {
                  type: 'FieldAccess',
                  path: ['data', 'priority'],
                },
                ': ',
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
        data: {
          priority: 8,
        },
      };

      const context: RenderContext = {};

      const rendered = runtimeWithTemplate.render(event, context);
      expect(rendered.title).toBe('Priority 8: Test Meeting');
    });

    it('should handle TemplateValue with undefined field', () => {
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
                  path: ['unknown'],
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

      const rendered = runtimeWithTemplate.render(event, context);
      expect(rendered.title).toBe('Meeting: ');
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

    it('should handle behavior rule with expression value - true case', () => {
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
        role: 'admin',
      };

      const canEdit = runtimeWithExpression.canPerform('editable', event, user);
      expect(canEdit).toBe(true);
    });

    it('should handle behavior rule with expression value - false case', () => {
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

      const canEdit = runtimeWithExpression.canPerform('editable', event, user);
      expect(canEdit).toBe(false);
    });

    it('should handle behavior rule with BinaryExpression - and', () => {
      const astWithBinary: EventTypeAST = {
        type: 'meeting',
        name: '会议',
        fields: [],
        validate: [],
        display: [],
        behavior: [
          {
            name: 'editable',
            value: {
              type: 'BinaryExpression',
              operator: 'and',
              left: {
                type: 'Comparison',
                operator: 'is',
                left: {
                  type: 'FieldAccess',
                  path: ['user', 'role'],
                },
                right: 'admin',
              },
              right: {
                type: 'Comparison',
                operator: 'is',
                left: {
                  type: 'FieldAccess',
                  path: ['status'],
                },
                right: 'active',
              },
            },
          },
        ],
      };

      const runtimeWithBinary = new EventDSLRuntime(astWithBinary);

      const event: Event = {
        id: '1',
        type: 'meeting',
        title: 'Test Meeting',
        startTime: new Date('2024-12-30T10:00:00'),
        endTime: new Date('2024-12-30T11:00:00'),
        data: {
          status: 'active',
        },
      };

      const user: User = {
        id: '1',
        email: 'user@example.com',
        role: 'admin',
      };

      const canEdit = runtimeWithBinary.canPerform('editable', event, user);
      expect(canEdit).toBe(true);
    });

    it('should handle behavior rule with BinaryExpression - or', () => {
      const astWithBinary: EventTypeAST = {
        type: 'meeting',
        name: '会议',
        fields: [],
        validate: [],
        display: [],
        behavior: [
          {
            name: 'editable',
            value: {
              type: 'BinaryExpression',
              operator: 'or',
              left: {
                type: 'Comparison',
                operator: 'is',
                left: {
                  type: 'FieldAccess',
                  path: ['user', 'role'],
                },
                right: 'admin',
              },
              right: {
                type: 'Comparison',
                operator: 'is',
                left: {
                  type: 'FieldAccess',
                  path: ['user', 'email'],
                },
                right: 'owner@example.com',
              },
            },
          },
        ],
      };

      const runtimeWithBinary = new EventDSLRuntime(astWithBinary);

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
        email: 'owner@example.com',
        role: 'user',
      };

      const canEdit = runtimeWithBinary.canPerform('editable', event, user);
      expect(canEdit).toBe(true);
    });

    it('should handle behavior rule with UnaryExpression - not', () => {
      const astWithUnary: EventTypeAST = {
        type: 'meeting',
        name: '会议',
        fields: [],
        validate: [],
        display: [],
        behavior: [
          {
            name: 'editable',
            value: {
              type: 'UnaryExpression',
              operator: 'not',
              argument: {
                type: 'Comparison',
                operator: 'is',
                left: {
                  type: 'FieldAccess',
                  path: ['status'],
                },
                right: 'cancelled',
              },
            },
          },
        ],
      };

      const runtimeWithUnary = new EventDSLRuntime(astWithUnary);

      const event: Event = {
        id: '1',
        type: 'meeting',
        title: 'Test Meeting',
        startTime: new Date('2024-12-30T10:00:00'),
        endTime: new Date('2024-12-30T11:00:00'),
        data: {
          status: 'active',
        },
      };

      const user: User = {
        id: '1',
        email: 'user@example.com',
        role: 'user',
      };

      const canEdit = runtimeWithUnary.canPerform('editable', event, user);
      expect(canEdit).toBe(true);
    });
  });

  describe('field access', () => {
    it('should access event.data fields', () => {
      const astWithFieldAccess: EventTypeAST = {
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
                {
                  type: 'FieldAccess',
                  path: ['data', 'title'],
                },
              ],
            },
          },
        ],
        behavior: [],
      };

      const runtimeWithFieldAccess = new EventDSLRuntime(astWithFieldAccess);

      const event: Event = {
        id: '1',
        type: 'meeting',
        title: 'Test Meeting',
        startTime: new Date('2024-12-30T10:00:00'),
        endTime: new Date('2024-12-30T11:00:00'),
        data: {
          title: 'Custom Title',
        },
      };

      const context: RenderContext = {};

      const rendered = runtimeWithFieldAccess.render(event, context);
      expect(rendered.title).toBe('Custom Title');
    });

    it('should access event special fields (startTime, endTime, title, type, id)', () => {
      const astWithSpecialFields: EventTypeAST = {
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
                {
                  type: 'FieldAccess',
                  path: ['type'],
                },
                ': ',
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

      const runtimeWithSpecialFields = new EventDSLRuntime(astWithSpecialFields);

      const event: Event = {
        id: '1',
        type: 'meeting',
        title: 'Test Meeting',
        startTime: new Date('2024-12-30T10:00:00'),
        endTime: new Date('2024-12-30T11:00:00'),
        data: {},
      };

      const context: RenderContext = {};

      const rendered = runtimeWithSpecialFields.render(event, context);
      expect(rendered.title).toBe('meeting: Test Meeting');
    });

    it('should access user fields from context', () => {
      const astWithUserAccess: EventTypeAST = {
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
                {
                  type: 'FieldAccess',
                  path: ['user', 'email'],
                },
                ' - ',
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

      const runtimeWithUserAccess = new EventDSLRuntime(astWithUserAccess);

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

      const rendered = runtimeWithUserAccess.render(event, context);
      expect(rendered.title).toBe('user@example.com - Test Meeting');
    });

    it('should handle Date field access in comparison', () => {
      const astWithDateComparison: EventTypeAST = {
        type: 'meeting',
        name: '会议',
        fields: [],
        validate: [
          {
            type: 'Comparison',
            operator: '>',
            left: {
              type: 'FieldAccess',
              path: ['startTime'],
            },
            right: new Date('2024-12-30T09:00:00'),
          },
        ],
        display: [],
        behavior: [],
      };

      const runtimeWithDateComparison = new EventDSLRuntime(astWithDateComparison);

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

      const result = runtimeWithDateComparison.validate(event, context);
      expect(result.valid).toBe(true);
    });

    it('should handle <= operator in comparison', () => {
      const astWithLessEqual: EventTypeAST = {
        type: 'meeting',
        name: '会议',
        fields: [],
        validate: [
          {
            type: 'Comparison',
            operator: '<=',
            left: {
              type: 'FieldAccess',
              path: ['priority'],
            },
            right: 10,
          },
        ],
        display: [],
        behavior: [],
      };

      const runtimeWithLessEqual = new EventDSLRuntime(astWithLessEqual);

      const event: Event = {
        id: '1',
        type: 'meeting',
        title: 'Test Meeting',
        startTime: new Date('2024-12-30T10:00:00'),
        endTime: new Date('2024-12-30T11:00:00'),
        data: {
          priority: 8,
        },
      };

      const context: ValidationContext = {
        events: [],
        now: new Date(),
      };

      const result = runtimeWithLessEqual.validate(event, context);
      expect(result.valid).toBe(true);
    });

    it('should handle unknown operator in comparison (default case)', () => {
      const astWithUnknownOp: EventTypeAST = {
        type: 'meeting',
        name: '会议',
        fields: [],
        validate: [
          {
            type: 'Comparison',
            operator: 'unknown',
            left: {
              type: 'FieldAccess',
              path: ['priority'],
            },
            right: 10,
          },
        ],
        display: [],
        behavior: [],
      };

      const runtimeWithUnknownOp = new EventDSLRuntime(astWithUnknownOp);

      const event: Event = {
        id: '1',
        type: 'meeting',
        title: 'Test Meeting',
        startTime: new Date('2024-12-30T10:00:00'),
        endTime: new Date('2024-12-30T11:00:00'),
        data: {
          priority: 8,
        },
      };

      const context: ValidationContext = {
        events: [],
        now: new Date(),
      };

      const result = runtimeWithUnknownOp.validate(event, context);
      expect(result.valid).toBe(false);
    });

    it('should skip self when checking time conflict', () => {
      const astWithNoConflict: EventTypeAST = {
        type: 'meeting',
        name: '会议',
        fields: [],
        validate: [
          {
            type: 'NoConflict',
          },
        ],
        display: [],
        behavior: [],
      };

      const runtimeWithNoConflict = new EventDSLRuntime(astWithNoConflict);

      const event: Event = {
        id: '1',
        type: 'meeting',
        title: 'Test Meeting',
        startTime: new Date('2024-12-30T10:00:00'),
        endTime: new Date('2024-12-30T11:00:00'),
        data: {},
      };

      // 包含自己的事件（应该被跳过）
      const context: ValidationContext = {
        events: [event],
        now: new Date(),
      };

      const result = runtimeWithNoConflict.validate(event, context);
      expect(result.valid).toBe(true);
    });

    it('should handle >= operator in comparison', () => {
      const astWithGreaterEqual: EventTypeAST = {
        type: 'meeting',
        name: '会议',
        fields: [],
        validate: [
          {
            type: 'Comparison',
            operator: '>=',
            left: {
              type: 'FieldAccess',
              path: ['priority'],
            },
            right: 5,
          },
        ],
        display: [],
        behavior: [],
      };

      const runtimeWithGreaterEqual = new EventDSLRuntime(astWithGreaterEqual);

      const event: Event = {
        id: '1',
        type: 'meeting',
        title: 'Test Meeting',
        startTime: new Date('2024-12-30T10:00:00'),
        endTime: new Date('2024-12-30T11:00:00'),
        data: {
          priority: 8,
        },
      };

      const context: ValidationContext = {
        events: [],
        now: new Date(),
      };

      const result = runtimeWithGreaterEqual.validate(event, context);
      expect(result.valid).toBe(true);
    });

    it('should handle Duration literal in Between rule', () => {
      const astWithDuration: EventTypeAST = {
        type: 'meeting',
        name: '会议',
        fields: [],
        validate: [
          {
            type: 'Between',
            field: {
              type: 'FieldAccess',
              path: ['duration'],
            },
            min: {
              type: 'Duration',
              value: 30,
              unit: 'minutes',
            },
            max: {
              type: 'Duration',
              value: 2,
              unit: 'hours',
            },
          },
        ],
        display: [],
        behavior: [],
      };

      const runtimeWithDuration = new EventDSLRuntime(astWithDuration);

      const event: Event = {
        id: '1',
        type: 'meeting',
        title: 'Test Meeting',
        startTime: new Date('2024-12-30T10:00:00'),
        endTime: new Date('2024-12-30T11:00:00'),
        data: {
          duration: 60, // 60 minutes
        },
      };

      const context: ValidationContext = {
        events: [],
        now: new Date(),
      };

      const result = runtimeWithDuration.validate(event, context);
      expect(result.valid).toBe(true);
    });

    it('should handle Duration literal with different units', () => {
      const astWithDuration: EventTypeAST = {
        type: 'meeting',
        name: '会议',
        fields: [],
        validate: [
          {
            type: 'Between',
            field: {
              type: 'FieldAccess',
              path: ['duration'],
            },
            min: {
              type: 'Duration',
              value: 1,
              unit: 'days',
            },
            max: {
              type: 'Duration',
              value: 1,
              unit: 'weeks',
            },
          },
        ],
        display: [],
        behavior: [],
      };

      const runtimeWithDuration = new EventDSLRuntime(astWithDuration);

      const event: Event = {
        id: '1',
        type: 'meeting',
        title: 'Test Meeting',
        startTime: new Date('2024-12-30T10:00:00'),
        endTime: new Date('2024-12-30T11:00:00'),
        data: {
          duration: 2880, // 2 days in minutes
        },
      };

      const context: ValidationContext = {
        events: [],
        now: new Date(),
      };

      const result = runtimeWithDuration.validate(event, context);
      expect(result.valid).toBe(true);
    });

    it('should handle Duration literal with unknown unit (default multiplier)', () => {
      const astWithDuration: EventTypeAST = {
        type: 'meeting',
        name: '会议',
        fields: [],
        validate: [
          {
            type: 'Between',
            field: {
              type: 'FieldAccess',
              path: ['duration'],
            },
            min: {
              type: 'Duration',
              value: 10,
              unit: 'unknown',
            },
            max: {
              type: 'Duration',
              value: 100,
              unit: 'unknown',
            },
          },
        ],
        display: [],
        behavior: [],
      };

      const runtimeWithDuration = new EventDSLRuntime(astWithDuration);

      const event: Event = {
        id: '1',
        type: 'meeting',
        title: 'Test Meeting',
        startTime: new Date('2024-12-30T10:00:00'),
        endTime: new Date('2024-12-30T11:00:00'),
        data: {
          duration: 50,
        },
      };

      const context: ValidationContext = {
        events: [],
        now: new Date(),
      };

      const result = runtimeWithDuration.validate(event, context);
      expect(result.valid).toBe(true);
    });

    it('should handle null literal value', () => {
      const astWithNull: EventTypeAST = {
        type: 'meeting',
        name: '会议',
        fields: [],
        validate: [
          {
            type: 'Comparison',
            operator: 'is',
            left: {
              type: 'FieldAccess',
              path: ['status'],
            },
            right: null,
          },
        ],
        display: [],
        behavior: [],
      };

      const runtimeWithNull = new EventDSLRuntime(astWithNull);

      const event: Event = {
        id: '1',
        type: 'meeting',
        title: 'Test Meeting',
        startTime: new Date('2024-12-30T10:00:00'),
        endTime: new Date('2024-12-30T11:00:00'),
        data: {
          status: null,
        },
      };

      const context: ValidationContext = {
        events: [],
        now: new Date(),
      };

      const result = runtimeWithNull.validate(event, context);
      expect(result.valid).toBe(true);
    });

    it('should access nested event.data fields (path.length > 1)', () => {
      const astWithNested: EventTypeAST = {
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
                {
                  type: 'FieldAccess',
                  path: ['nested', 'field', 'value'],
                },
              ],
            },
          },
        ],
        behavior: [],
      };

      const runtimeWithNested = new EventDSLRuntime(astWithNested);

      const event: Event = {
        id: '1',
        type: 'meeting',
        title: 'Test Meeting',
        startTime: new Date('2024-12-30T10:00:00'),
        endTime: new Date('2024-12-30T11:00:00'),
        data: {
          nested: {
            field: {
              value: 'Nested Value',
            },
          },
        },
      };

      const context: RenderContext = {};

      const rendered = runtimeWithNested.render(event, context);
      expect(rendered.title).toBe('Nested Value');
    });

    it('should handle nested field access with null intermediate value', () => {
      const astWithNested: EventTypeAST = {
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
                {
                  type: 'FieldAccess',
                  path: ['nested', 'field', 'value'],
                },
              ],
            },
          },
        ],
        behavior: [],
      };

      const runtimeWithNested = new EventDSLRuntime(astWithNested);

      const event: Event = {
        id: '1',
        type: 'meeting',
        title: 'Test Meeting',
        startTime: new Date('2024-12-30T10:00:00'),
        endTime: new Date('2024-12-30T11:00:00'),
        data: {
          nested: null,
        },
      };

      const context: RenderContext = {};

      const rendered = runtimeWithNested.render(event, context);
      expect(rendered.title).toBe('');
    });

    it('should handle getExpressionValue with non-FieldAccess expression', () => {
      const astWithNonFieldAccess: EventTypeAST = {
        type: 'meeting',
        name: '会议',
        fields: [],
        validate: [
          {
            type: 'Comparison',
            operator: 'is',
            left: 'directValue' as any,
            right: 'directValue',
          },
        ],
        display: [],
        behavior: [],
      };

      const runtimeWithNonFieldAccess = new EventDSLRuntime(astWithNonFieldAccess);

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

      const result = runtimeWithNonFieldAccess.validate(event, context);
      expect(result.valid).toBe(true);
    });

    it('should handle field access with empty path', () => {
      const astWithEmptyPath: EventTypeAST = {
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
                {
                  type: 'FieldAccess',
                  path: [],
                },
              ],
            },
          },
        ],
        behavior: [],
      };

      const runtimeWithEmptyPath = new EventDSLRuntime(astWithEmptyPath);

      const event: Event = {
        id: '1',
        type: 'meeting',
        title: 'Test Meeting',
        startTime: new Date('2024-12-30T10:00:00'),
        endTime: new Date('2024-12-30T11:00:00'),
        data: {},
      };

      const context: RenderContext = {};

      const rendered = runtimeWithEmptyPath.render(event, context);
      expect(rendered.title).toBe('');
    });

    it('should handle field access with invalid fieldAccess object', () => {
      const astWithInvalid: EventTypeAST = {
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
                null as any,
              ],
            },
          },
        ],
        behavior: [],
      };

      const runtimeWithInvalid = new EventDSLRuntime(astWithInvalid);

      const event: Event = {
        id: '1',
        type: 'meeting',
        title: 'Test Meeting',
        startTime: new Date('2024-12-30T10:00:00'),
        endTime: new Date('2024-12-30T11:00:00'),
        data: {},
      };

      const context: RenderContext = {};

      const rendered = runtimeWithInvalid.render(event, context);
      expect(rendered.title).toBe('');
    });

    it('should access event.id field', () => {
      const astWithId: EventTypeAST = {
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
                'ID: ',
                {
                  type: 'FieldAccess',
                  path: ['id'],
                },
              ],
            },
          },
        ],
        behavior: [],
      };

      const runtimeWithId = new EventDSLRuntime(astWithId);

      const event: Event = {
        id: 'event-123',
        type: 'meeting',
        title: 'Test Meeting',
        startTime: new Date('2024-12-30T10:00:00'),
        endTime: new Date('2024-12-30T11:00:00'),
        data: {},
      };

      const context: RenderContext = {};

      const rendered = runtimeWithId.render(event, context);
      expect(rendered.title).toBe('ID: event-123');
    });

    it('should handle data field access with null intermediate value', () => {
      const astWithDataNull: EventTypeAST = {
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
                {
                  type: 'FieldAccess',
                  path: ['data', 'nested', 'value'],
                },
              ],
            },
          },
        ],
        behavior: [],
      };

      const runtimeWithDataNull = new EventDSLRuntime(astWithDataNull);

      const event: Event = {
        id: '1',
        type: 'meeting',
        title: 'Test Meeting',
        startTime: new Date('2024-12-30T10:00:00'),
        endTime: new Date('2024-12-30T11:00:00'),
        data: {
          nested: null,
        },
      };

      const context: RenderContext = {};

      const rendered = runtimeWithDataNull.render(event, context);
      expect(rendered.title).toBe('');
    });

    it('should handle field access that does not match any condition', () => {
      const astWithUnknown: EventTypeAST = {
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
                {
                  type: 'FieldAccess',
                  path: ['unknownField'],
                },
              ],
            },
          },
        ],
        behavior: [],
      };

      const runtimeWithUnknown = new EventDSLRuntime(astWithUnknown);

      const event: Event = {
        id: '1',
        type: 'meeting',
        title: 'Test Meeting',
        startTime: new Date('2024-12-30T10:00:00'),
        endTime: new Date('2024-12-30T11:00:00'),
        data: {},
      };

      const context: RenderContext = {};

      const rendered = runtimeWithUnknown.render(event, context);
      expect(rendered.title).toBe('');
    });

    it('should access event.endTime field', () => {
      const astWithEndTime: EventTypeAST = {
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
                'Ends at: ',
                {
                  type: 'FieldAccess',
                  path: ['endTime'],
                },
              ],
            },
          },
        ],
        behavior: [],
      };

      const runtimeWithEndTime = new EventDSLRuntime(astWithEndTime);

      const event: Event = {
        id: '1',
        type: 'meeting',
        title: 'Test Meeting',
        startTime: new Date('2024-12-30T10:00:00'),
        endTime: new Date('2024-12-30T11:00:00'),
        data: {},
      };

      const context: RenderContext = {};

      const rendered = runtimeWithEndTime.render(event, context);
      expect(rendered.title).toContain('Ends at:');
      expect(rendered.title).toContain('2024');
    });

    it('should handle user field access with null intermediate value', () => {
      const astWithUserNull: EventTypeAST = {
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
                {
                  type: 'FieldAccess',
                  path: ['user', 'profile', 'name'],
                },
              ],
            },
          },
        ],
        behavior: [],
      };

      const runtimeWithUserNull = new EventDSLRuntime(astWithUserNull);

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
        profile: null as any,
      };

      const context: RenderContext = {
        user,
      };

      const rendered = runtimeWithUserNull.render(event, context);
      expect(rendered.title).toBe('');
    });
  });
});

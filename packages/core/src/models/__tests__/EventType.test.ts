import { describe, it, expect } from 'vitest';
import { EventTypeDefinition, JSONSchema } from './EventType';
import { Event } from './Event';
import { User } from './User';
import { ValidationContext } from '../contexts/ValidationContext';
import { RenderContext } from '../contexts/RenderContext';
import { ValidationResult } from '../types/common';
import { RenderedEvent } from '../types/common';

describe('EventType', () => {
  describe('JSONSchema interface', () => {
    it('should create a valid JSONSchema object', () => {
      const schema: JSONSchema = {
        type: 'object',
        properties: {
          title: { type: 'string' },
          count: { type: 'number' },
        },
        required: ['title'],
      };

      expect(schema.type).toBe('object');
      expect(schema.properties).toBeDefined();
      expect(schema.required).toEqual(['title']);
    });

    it('should support $schema field', () => {
      const schema: JSONSchema = {
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: {},
      };

      expect(schema.$schema).toBe('http://json-schema.org/draft-07/schema#');
    });

    it('should support additionalProperties', () => {
      const schema: JSONSchema = {
        type: 'object',
        additionalProperties: false,
        properties: {},
      };

      expect(schema.additionalProperties).toBe(false);
    });

    it('should support extended properties', () => {
      const schema: JSONSchema = {
        type: 'object',
        properties: {},
        title: 'My Schema',
        description: 'Schema description',
      };

      expect(schema.title).toBe('My Schema');
      expect(schema.description).toBe('Schema description');
    });
  });

  describe('EventTypeDefinition interface', () => {
    it('should create a valid EventTypeDefinition with required fields', () => {
      const schema: JSONSchema = {
        type: 'object',
        properties: {},
      };

      const eventType: EventTypeDefinition = {
        type: 'meeting',
        name: '会议',
        schema,
      };

      expect(eventType.type).toBe('meeting');
      expect(eventType.name).toBe('会议');
      expect(eventType.schema).toBe(schema);
    });

    it('should create EventTypeDefinition with optional description', () => {
      const schema: JSONSchema = {
        type: 'object',
        properties: {},
      };

      const eventType: EventTypeDefinition = {
        type: 'meeting',
        name: '会议',
        description: '团队会议类型',
        schema,
      };

      expect(eventType.description).toBe('团队会议类型');
    });

    it('should support validate function', () => {
      const schema: JSONSchema = {
        type: 'object',
        properties: {},
      };

      const validateFn = (event: Event, context: ValidationContext): ValidationResult => {
        return { valid: true };
      };

      const eventType: EventTypeDefinition = {
        type: 'meeting',
        name: '会议',
        schema,
        validate: validateFn,
      };

      expect(eventType.validate).toBeDefined();
      expect(typeof eventType.validate).toBe('function');

      const event: Event = {
        id: '1',
        type: 'meeting',
        title: 'Test',
        startTime: new Date(),
        endTime: new Date(),
        data: {},
      };

      const context: ValidationContext = {
        events: [],
        now: new Date(),
      };

      const result = eventType.validate!(event, context);
      expect(result.valid).toBe(true);
    });

    it('should support render function', () => {
      const schema: JSONSchema = {
        type: 'object',
        properties: {},
      };

      const renderFn = (event: Event, context: RenderContext): RenderedEvent => {
        return {
          title: event.title,
          color: '#4285f4',
        };
      };

      const eventType: EventTypeDefinition = {
        type: 'meeting',
        name: '会议',
        schema,
        render: renderFn,
      };

      expect(eventType.render).toBeDefined();
      expect(typeof eventType.render).toBe('function');

      const event: Event = {
        id: '1',
        type: 'meeting',
        title: 'Test Meeting',
        startTime: new Date(),
        endTime: new Date(),
        data: {},
      };

      const context: RenderContext = {};

      const result = eventType.render!(event, context);
      expect(result.title).toBe('Test Meeting');
      expect(result.color).toBe('#4285f4');
    });

    it('should support canPerform function', () => {
      const schema: JSONSchema = {
        type: 'object',
        properties: {},
      };

      const canPerformFn = (action: string, event: Event, user: User): boolean => {
        return user.role === 'admin' || action === 'read';
      };

      const eventType: EventTypeDefinition = {
        type: 'meeting',
        name: '会议',
        schema,
        canPerform: canPerformFn,
      };

      expect(eventType.canPerform).toBeDefined();
      expect(typeof eventType.canPerform).toBe('function');

      const event: Event = {
        id: '1',
        type: 'meeting',
        title: 'Test',
        startTime: new Date(),
        endTime: new Date(),
        data: {},
      };

      const adminUser: User = {
        id: '1',
        email: 'admin@example.com',
        role: 'admin',
      };

      const regularUser: User = {
        id: '2',
        email: 'user@example.com',
        role: 'user',
      };

      expect(eventType.canPerform!('delete', event, adminUser)).toBe(true);
      expect(eventType.canPerform!('delete', event, regularUser)).toBe(false);
      expect(eventType.canPerform!('read', event, regularUser)).toBe(true);
    });
  });
});

import { describe, it, expect } from 'vitest';
import type {
  Event,
  EventMetadata,
  User,
  UserRole,
  EventTypeDefinition,
  JSONSchema,
  ValidationContext,
  RenderContext,
  ValidationResult,
  RenderedEvent,
} from './index';

describe('@calenderjs/core index', () => {
  it('should export all model types', () => {
    const event: Event = {
      id: '1',
      type: 'test',
      title: 'Test',
      startTime: new Date(),
      endTime: new Date(),
      data: {},
    };
    const metadata: EventMetadata = {
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const user: User = {
      id: '1',
      email: 'test@example.com',
      role: 'user',
    };
    const role: UserRole = 'admin';
    const schema: JSONSchema = {
      type: 'object',
      properties: {},
    };
    const eventType: EventTypeDefinition = {
      type: 'test',
      name: 'Test',
      schema,
    };

    expect(event).toBeDefined();
    expect(metadata).toBeDefined();
    expect(user).toBeDefined();
    expect(role).toBe('admin');
    expect(schema).toBeDefined();
    expect(eventType).toBeDefined();
  });

  it('should export all context types', () => {
    const validationContext: ValidationContext = {
      events: [],
      now: new Date(),
    };
    const renderContext: RenderContext = {};

    expect(validationContext).toBeDefined();
    expect(renderContext).toBeDefined();
  });

  it('should export all common types', () => {
    const validationResult: ValidationResult = {
      valid: true,
    };
    const renderedEvent: RenderedEvent = {
      title: 'Test',
      color: '#000',
    };

    expect(validationResult).toBeDefined();
    expect(renderedEvent).toBeDefined();
  });
});

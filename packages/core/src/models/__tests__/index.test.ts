import { describe, it, expect } from 'vitest';
import type { Event, EventMetadata, User, UserRole, EventTypeDefinition, JSONSchema } from './index';

describe('models/index', () => {
  it('should export Event and EventMetadata types', () => {
    // Type-only test - verify types exist at compile time
    const event: Event = {
      id: '1',
      type: 'test',
      title: 'Test',
      startTime: new Date(),
      endTime: new Date(),
      data: {},
    };
    expect(event).toBeDefined();

    const metadata: EventMetadata = {
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    expect(metadata).toBeDefined();
  });

  it('should export User and UserRole types', () => {
    const user: User = {
      id: '1',
      email: 'test@example.com',
      role: 'user',
    };
    expect(user).toBeDefined();

    const role: UserRole = 'admin';
    expect(role).toBe('admin');
  });

  it('should export EventTypeDefinition and JSONSchema types', () => {
    const schema: JSONSchema = {
      type: 'object',
      properties: {},
    };
    expect(schema).toBeDefined();

    const eventType: EventTypeDefinition = {
      type: 'test',
      name: 'Test',
      schema,
    };
    expect(eventType).toBeDefined();
  });
});

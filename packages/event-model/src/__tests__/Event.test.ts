import { describe, it, expect } from 'vitest';
import type { Event, EventMetadata } from '../Event';

describe('Event', () => {
  it('should create a valid Event', () => {
    const event: Event = {
      id: 'event-1',
      type: 'meeting',
      title: '团队会议',
      startTime: new Date('2025-01-15T10:00:00'),
      endTime: new Date('2025-01-15T11:00:00'),
      extra: {
        attendees: ['user1@example.com'],
        location: '会议室 A',
      },
    };

    expect(event.id).toBe('event-1');
    expect(event.type).toBe('meeting');
    expect(event.title).toBe('团队会议');
    expect(event.extra?.attendees).toEqual(['user1@example.com']);
  });

  it('should support EventMetadata', () => {
    const metadata: EventMetadata = {
      createdAt: new Date('2025-01-15T09:00:00'),
      updatedAt: new Date('2025-01-15T09:30:00'),
      createdBy: 'user1',
      version: 1,
    };

    const event: Event = {
      id: 'event-1',
      type: 'meeting',
      title: '团队会议',
      startTime: new Date('2025-01-15T10:00:00'),
      endTime: new Date('2025-01-15T11:00:00'),
      extra: {},
      metadata,
    };

    expect(event.metadata?.createdBy).toBe('user1');
    expect(event.metadata?.version).toBe(1);
  });

  it('should support Event without metadata', () => {
    const event: Event = {
      id: 'event-1',
      type: 'meeting',
      title: '团队会议',
      startTime: new Date('2025-01-15T10:00:00'),
      endTime: new Date('2025-01-15T11:00:00'),
      extra: {},
    };

    expect(event.metadata).toBeUndefined();
  });

  it('should support Event.extra with DSL-defined fields', () => {
    const event: Event = {
      id: 'event-1',
      type: 'meeting',
      title: '团队会议',
      startTime: new Date('2025-01-15T10:00:00'),
      endTime: new Date('2025-01-15T11:00:00'),
      extra: {
        attendees: ['user1@example.com', 'user2@example.com'],
        location: '会议室 A',
        priority: 'high',
      },
    };

    expect(event.extra?.attendees).toHaveLength(2);
    expect(event.extra?.location).toBe('会议室 A');
    expect(event.extra?.priority).toBe('high');
  });
});

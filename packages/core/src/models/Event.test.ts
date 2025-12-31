import { describe, it, expect } from 'vitest';
import { Event, EventMetadata } from './Event';

describe('Event', () => {
  describe('Event interface', () => {
    it('should create a valid Event object', () => {
      const event: Event = {
        id: '1',
        type: 'meeting',
        title: 'Team Meeting',
        startTime: new Date('2024-12-30T10:00:00'),
        endTime: new Date('2024-12-30T11:00:00'),
        data: {
          attendees: ['user1@example.com'],
        },
      };

      expect(event.id).toBe('1');
      expect(event.type).toBe('meeting');
      expect(event.title).toBe('Team Meeting');
      expect(event.startTime).toBeInstanceOf(Date);
      expect(event.endTime).toBeInstanceOf(Date);
      expect(event.data).toEqual({ attendees: ['user1@example.com'] });
    });

    it('should create Event with metadata', () => {
      const metadata: EventMetadata = {
        createdAt: new Date('2024-12-30T09:00:00'),
        updatedAt: new Date('2024-12-30T09:30:00'),
        createdBy: 'user1',
        updatedBy: 'user2',
        version: 1,
      };

      const event: Event = {
        id: '1',
        type: 'meeting',
        title: 'Team Meeting',
        startTime: new Date('2024-12-30T10:00:00'),
        endTime: new Date('2024-12-30T11:00:00'),
        data: {},
        metadata,
      };

      expect(event.metadata).toBeDefined();
      expect(event.metadata?.createdAt).toBeInstanceOf(Date);
      expect(event.metadata?.updatedAt).toBeInstanceOf(Date);
      expect(event.metadata?.createdBy).toBe('user1');
      expect(event.metadata?.updatedBy).toBe('user2');
      expect(event.metadata?.version).toBe(1);
    });

    it('should create Event without metadata', () => {
      const event: Event = {
        id: '1',
        type: 'meeting',
        title: 'Team Meeting',
        startTime: new Date('2024-12-30T10:00:00'),
        endTime: new Date('2024-12-30T11:00:00'),
        data: {},
      };

      expect(event.metadata).toBeUndefined();
    });

    it('should handle empty data object', () => {
      const event: Event = {
        id: '1',
        type: 'meeting',
        title: 'Team Meeting',
        startTime: new Date('2024-12-30T10:00:00'),
        endTime: new Date('2024-12-30T11:00:00'),
        data: {},
      };

      expect(event.data).toEqual({});
    });

    it('should handle complex data structure', () => {
      const event: Event = {
        id: '1',
        type: 'meeting',
        title: 'Team Meeting',
        startTime: new Date('2024-12-30T10:00:00'),
        endTime: new Date('2024-12-30T11:00:00'),
        data: {
          attendees: ['user1@example.com', 'user2@example.com'],
          location: 'Conference Room A',
          priority: 'high',
          tags: ['important', 'team'],
        },
      };

      expect(event.data.attendees).toHaveLength(2);
      expect(event.data.location).toBe('Conference Room A');
      expect(event.data.priority).toBe('high');
      expect(event.data.tags).toEqual(['important', 'team']);
    });
  });

  describe('EventMetadata interface', () => {
    it('should create EventMetadata with all fields', () => {
      const metadata: EventMetadata = {
        createdAt: new Date('2024-12-30T09:00:00'),
        updatedAt: new Date('2024-12-30T09:30:00'),
        createdBy: 'user1',
        updatedBy: 'user2',
        version: 1,
      };

      expect(metadata.createdAt).toBeInstanceOf(Date);
      expect(metadata.updatedAt).toBeInstanceOf(Date);
      expect(metadata.createdBy).toBe('user1');
      expect(metadata.updatedBy).toBe('user2');
      expect(metadata.version).toBe(1);
    });

    it('should create EventMetadata with only required fields', () => {
      const metadata: EventMetadata = {
        createdAt: new Date('2024-12-30T09:00:00'),
        updatedAt: new Date('2024-12-30T09:30:00'),
      };

      expect(metadata.createdAt).toBeInstanceOf(Date);
      expect(metadata.updatedAt).toBeInstanceOf(Date);
      expect(metadata.createdBy).toBeUndefined();
      expect(metadata.updatedBy).toBeUndefined();
      expect(metadata.version).toBeUndefined();
    });
  });
});

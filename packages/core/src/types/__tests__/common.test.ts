import { describe, it, expect } from 'vitest';
import { ValidationResult, RenderedEvent } from './common';

describe('Common Types', () => {
  describe('ValidationResult', () => {
    it('should create a valid ValidationResult with valid true', () => {
      const result: ValidationResult = {
        valid: true,
      };

      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('should create ValidationResult with valid false and errors', () => {
      const result: ValidationResult = {
        valid: false,
        errors: ['Error 1', 'Error 2'],
      };

      expect(result.valid).toBe(false);
      expect(result.errors).toEqual(['Error 1', 'Error 2']);
      expect(result.errors).toHaveLength(2);
    });

    it('should create ValidationResult with valid false and empty errors array', () => {
      const result: ValidationResult = {
        valid: false,
        errors: [],
      };

      expect(result.valid).toBe(false);
      expect(result.errors).toEqual([]);
      expect(result.errors?.length).toBe(0);
    });

    it('should create ValidationResult with valid true and undefined errors', () => {
      const result: ValidationResult = {
        valid: true,
        errors: undefined,
      };

      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });
  });

  describe('RenderedEvent', () => {
    it('should create a valid RenderedEvent with required fields', () => {
      const rendered: RenderedEvent = {
        title: 'Meeting Title',
        color: '#4285f4',
      };

      expect(rendered.title).toBe('Meeting Title');
      expect(rendered.color).toBe('#4285f4');
    });

    it('should create RenderedEvent with optional icon', () => {
      const rendered: RenderedEvent = {
        title: 'Meeting Title',
        color: '#4285f4',
        icon: '📅',
      };

      expect(rendered.icon).toBe('📅');
    });

    it('should create RenderedEvent with optional description', () => {
      const rendered: RenderedEvent = {
        title: 'Meeting Title',
        color: '#4285f4',
        description: 'Meeting description',
      };

      expect(rendered.description).toBe('Meeting description');
    });

    it('should create RenderedEvent with all fields', () => {
      const rendered: RenderedEvent = {
        title: 'Meeting Title',
        color: '#4285f4',
        icon: '📅',
        description: 'Meeting description',
      };

      expect(rendered.title).toBe('Meeting Title');
      expect(rendered.color).toBe('#4285f4');
      expect(rendered.icon).toBe('📅');
      expect(rendered.description).toBe('Meeting description');
    });

    it('should handle different color formats', () => {
      const hexColor: RenderedEvent = {
        title: 'Event',
        color: '#4285f4',
      };

      const rgbColor: RenderedEvent = {
        title: 'Event',
        color: 'rgb(66, 133, 244)',
      };

      const namedColor: RenderedEvent = {
        title: 'Event',
        color: 'blue',
      };

      expect(hexColor.color).toBe('#4285f4');
      expect(rgbColor.color).toBe('rgb(66, 133, 244)');
      expect(namedColor.color).toBe('blue');
    });
  });
});

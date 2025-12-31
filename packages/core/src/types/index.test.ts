import { describe, it, expect } from 'vitest';
import type { ValidationResult, RenderedEvent } from './index';

describe('types/index', () => {
  it('should export ValidationResult type', () => {
    const result: ValidationResult = {
      valid: true,
    };
    expect(result).toBeDefined();
  });

  it('should export RenderedEvent type', () => {
    const rendered: RenderedEvent = {
      title: 'Test',
      color: '#000',
    };
    expect(rendered).toBeDefined();
  });
});

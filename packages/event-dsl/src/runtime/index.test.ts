import { describe, it, expect } from 'vitest';
import { EventDSLRuntime } from './index';

describe('runtime/index', () => {
  it('should export EventDSLRuntime', () => {
    expect(EventDSLRuntime).toBeDefined();
    expect(typeof EventDSLRuntime).toBe('function');
  });
});

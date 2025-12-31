import { describe, it, expect } from 'vitest';
import type { EventTypeAST } from './index';

describe('ast/index', () => {
  it('should export EventTypeAST type', () => {
    const ast: EventTypeAST = {
      type: 'test',
      name: 'Test',
      fields: [],
      validate: [],
      display: [],
      behavior: [],
    };
    expect(ast).toBeDefined();
  });
});

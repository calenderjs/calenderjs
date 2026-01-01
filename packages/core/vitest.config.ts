import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/__tests__/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/__tests__/**',
        '**/Calendar.ts', // 旧文件，待重构
        '**/types.ts', // 旧文件，待重构
        '**/utils/**', // 旧文件，待重构
      ],
      lines: 100,
      functions: 100,
      branches: 100,
      statements: 100,
    },
  },
});

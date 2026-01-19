import { defineConfig, type AliasOptions } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { wsx } from '@wsxjs/wsx-vite-plugin';

export default defineConfig(({ command, mode }) => {
  const isDev = command === 'serve' || mode === 'development';
  const rootDir = path.resolve(__dirname, '../..');
  
  // 基础别名
  const baseAliases: AliasOptions = {
    '@': path.resolve(__dirname, './src'),
  };
  
  // 在开发模式下，使用别名指向源码，实现热重载
  const devAliases: AliasOptions = isDev ? {
    '@calenderjs/react': path.resolve(rootDir, 'packages/react/src/index.ts'),
    '@calenderjs/core': path.resolve(rootDir, 'packages/core/src/index.ts'),
    '@calenderjs/calendar': path.resolve(rootDir, 'packages/calendar/src/index.ts'),
    '@calenderjs/date-time': path.resolve(rootDir, 'packages/date-time/src/index.ts'),
    '@calenderjs/event-dsl': path.resolve(rootDir, 'packages/event-dsl/src/index.ts'),
    '@calenderjs/event-model': path.resolve(rootDir, 'packages/event-model/src/index.ts'),
    '@calenderjs/event-runtime': path.resolve(rootDir, 'packages/event-runtime/src/index.ts'),
    '@calenderjs/monaco-event-dsl': path.resolve(rootDir, 'packages/monaco-event-dsl/src/index.ts'),
  } : {};

  return {
    plugins: [
      // 在开发模式下添加 WSX 插件以支持 .wsx 文件（calendar 包使用）
      ...(isDev ? [wsx({
        debug: false,
        jsxFactory: 'jsx',
        jsxFragment: 'Fragment',
      })] : []),
      react(),
    ],
    resolve: {
      alias: {
        ...baseAliases,
        ...devAliases,
      },
    },
    server: {
      port: 3000,
      open: true,
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
    },
  };
});

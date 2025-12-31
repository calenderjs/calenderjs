import { defineConfig } from 'vite';
import { resolve } from 'path';
import wsx from '@wsxjs/wsx-vite-plugin';

export default defineConfig({
  plugins: [wsx()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'CalenderJSCalendar',
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      external: ['@calenderjs/core', '@calenderjs/event-dsl', '@wsxjs/wsx-core'],
      output: {
        globals: {
          '@calenderjs/core': 'CalenderJSCore',
          '@calenderjs/event-dsl': 'CalenderJSEventDSL',
          '@wsxjs/wsx-core': 'WSXCore',
        },
      },
    },
    cssCodeSplit: false,
    sourcemap: true,
  },
});

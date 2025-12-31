import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'CalenderJSCore',
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      external: [],
      output: {},
    },
    cssCodeSplit: false,
    sourcemap: true,
  },
});

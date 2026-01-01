import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'CalenderJSReact',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'mjs' : 'cjs'}`,
    },
    rollupOptions: {
      external: ['react', 'react-dom', '@calenderjs/calendar', '@calenderjs/core'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          '@calenderjs/calendar': 'CalenderJSCalendar',
          '@calenderjs/core': 'CalenderJSCore',
        },
      },
    },
  },
});

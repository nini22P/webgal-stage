import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'WebGAL Stage',
      fileName: (format) => `webgal-stage.${format === 'es' ? 'js' : 'umd.cjs'}`,
      formats: ['es', 'umd'],
    },
    rollupOptions: {
      external: ['gsap'],
      output: {
        globals: {
          gsap: 'gsap',
        },
      },
    },
    sourcemap: true,
    emptyOutDir: true,
  },
});


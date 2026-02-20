import { defineConfig } from 'vite'
import { resolve } from 'path'
import dts from 'vite-plugin-dts'

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'TinyStage',
      fileName: 'index',
      formats: ['es'],
    },
    rollupOptions: {
      external: ['gsap', 'howler', 'pixi.js'],
    },
    sourcemap: true,
    emptyOutDir: true,
  },
  plugins: [dts()]
})


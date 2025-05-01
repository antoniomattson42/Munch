// vite.config.content.ts
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: false, // Do not clear the dist folder
    lib: {
      entry: resolve(__dirname, 'src/content.js'),
      name: 'ContentScript',
      formats: ['iife'],
      fileName: () => 'content.js',
    },
  },
});

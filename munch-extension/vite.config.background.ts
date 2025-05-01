import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: false, // Prevents deleting the dist folder between builds
    rollupOptions: {
      input: resolve(__dirname, 'src/background.js'),
      output: {
        entryFileNames: 'background.js',
        format: 'es',
      },
    },
  },
});

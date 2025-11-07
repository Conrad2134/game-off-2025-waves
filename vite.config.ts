import { defineConfig } from 'vite';

export default defineConfig({
  publicDir: 'public',
  build: {
    target: 'es2020',
    outDir: 'dist',
  },
  server: {
    port: 5173,
    open: false,
  },
});

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

// Renderer lives in ./renderer and is bundled to ./renderer/dist, loaded by
// Electron over file:// — hence the relative base.
export default defineConfig({
  root: 'renderer',
  base: './',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, 'renderer/src') },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});

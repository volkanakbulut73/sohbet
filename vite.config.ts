
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: undefined, // Küçük projelerde chunk'ları bölmemek MIME sorunlarını azaltabilir
      }
    }
  },
  server: {
    host: true,
    port: 5173,
    strictPort: true,
  }
});

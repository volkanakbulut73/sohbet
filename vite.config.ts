
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
    rollupOptions: {
      output: {
        // SDK olarak kullanılacağı için isimleri sabit tutmak entegrasyonu kolaylaştırır
        entryFileNames: `assets/[name].js`,
        chunkFileNames: `assets/[name].js`,
        assetFileNames: `assets/[name].[ext]`
      }
    }
  },
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    cors: true // Yerel geliştirmede CORS izinlerini açar
  }
});

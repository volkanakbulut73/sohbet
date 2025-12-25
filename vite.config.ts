
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
    modulePreload: false, // Preload linklerini devre dışı bırak (CORS karmaşasını önler)
    rollupOptions: {
      output: {
        // TÜM SDK'YI TEK BİR DOSYADA TOPLA:
        // Bu ayar, 'Failed to fetch dynamically imported module' hatasını kökten çözer.
        inlineDynamicImports: true, 
        entryFileNames: 'index.js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        manualChunks: undefined,
      }
    }
  },
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    cors: true
  }
});

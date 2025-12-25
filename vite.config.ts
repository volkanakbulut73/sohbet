
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
        // Ana SDK dosyasını assets klasöründen çıkarıp root'a alıyoruz.
        // Bu sayede Vercel 307 Redirect yapmaz, doğrudan dosyayı servis eder.
        entryFileNames: `[name].js`, 
        chunkFileNames: `assets/[name]-[hash].js`,
        assetFileNames: `assets/[name]-[hash].[ext]`
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

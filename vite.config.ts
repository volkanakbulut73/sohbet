
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './', // Dosya yollarını göreceli yaparak ./assets/... şeklinde ayarlar
  define: {
    'process.env': {}
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          libs: ['@supabase/supabase-js', '@google/genai', 'lucide-react']
        }
      }
    }
  }
});

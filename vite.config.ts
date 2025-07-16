import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Configurar base path para deploy em subdiretório
  base: '/tester/',
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // Garantir que os assets sejam referenciados corretamente
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
});

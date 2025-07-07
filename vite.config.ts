import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Configurar base path para deploy em subdiretório
  base: '/prompt-tester/',
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});

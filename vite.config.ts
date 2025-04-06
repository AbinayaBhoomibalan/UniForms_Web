import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    rollupOptions: {
      external: [] // Explicitly define modules that should be external
    }
  },
  base: process.env.VITE_BASE_PATH || "/UniForms_Web",
});

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages serves project sites below /<repository-name>/.
// Local development and ordinary builds continue to use the site root.
export default defineConfig(({ mode }) => ({
  base: mode === 'github-pages' ? '/Herd_Immunity/' : '/',
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
}));

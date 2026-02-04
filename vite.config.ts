import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  // Base path: '/build-a-jam/' for GitHub Pages production build,
  // '/' for local dev so refreshing doesn't show a redirect warning
  base: command === 'build' ? '/build-a-jam/' : '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // The exercise JSON data pushes the main chunk past 500 kB.
    // This is expected for bundled static data — suppress the warning.
    chunkSizeWarningLimit: 2200,
  },
  server: {
    port: 5173,
    strictPort: true, // Fail if port is in use instead of auto-incrementing
  },
}));

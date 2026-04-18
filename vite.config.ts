import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(() => {
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) {
              return undefined;
            }

            if (
              id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom') ||
              id.includes('node_modules/scheduler') ||
              id.includes('node_modules/use-sync-external-store')
            ) {
              return 'react-vendor';
            }

            if (id.includes('framer-motion')) {
              return 'motion';
            }

            if (id.includes('lucide-react')) {
              return 'icons';
            }

            if (id.includes('firebase')) {
              return 'firebase';
            }

            if (id.includes('@google/genai')) {
              return 'ai';
            }

            if (id.includes('tailwind-merge') || id.includes('clsx')) {
              return 'utils';
            }

            return 'vendor';
          },
        },
      },
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: './vitest.setup.ts',
    },
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});

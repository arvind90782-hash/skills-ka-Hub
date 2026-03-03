import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react(), tailwindcss()],
      define: {
        // expose the key(s) to the client bundle; allow several variable names so users
        // can set whichever they prefer in their .env file.
        'process.env.API_KEY': JSON.stringify(env.API_KEY || env.GEMINI_API_KEY || env.VITE_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.VITE_API_KEY': JSON.stringify(env.VITE_API_KEY)
      },
      // warn if the key is missing during config load
      configureServer(server) {
        if (!env.API_KEY && !env.GEMINI_API_KEY && !env.VITE_API_KEY) {
          console.warn('⚠️  No Gemini API key found in environment. Please add one to your .env file.');
        }
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});

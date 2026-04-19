import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const readRequestBody = (req: NodeJS.ReadableStream): Promise<string> =>
  new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];

    req.on('data', (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });

const localApiPlugin = () => ({
  name: 'skills-hub-local-api',
  configureServer(server: import('vite').ViteDevServer) {
    server.middlewares.use(async (req, res, next) => {
      const pathname = req.url?.split('?')[0];
      const routeMap: Record<string, string> = {
        '/api/gemini': '/api/gemini.ts',
        '/api/downloader': '/api/downloader.ts',
      };

      const modulePath = pathname ? routeMap[pathname] : undefined;
      if (!modulePath) {
        next();
        return;
      }

      try {
        const mod = await server.ssrLoadModule(modulePath);
        if (req.method === 'POST') {
          (req as any).body = await readRequestBody(req);
        }
        await mod.default(req, res);
      } catch (error) {
        server.ssrFixStacktrace(error as Error);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(
          JSON.stringify({
            ok: false,
            error: error instanceof Error ? error.message : 'Local API middleware failed',
          })
        );
      }
    });
  },
});

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
    plugins: [react(), tailwindcss(), localApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv, Plugin } from 'vite';
import electron from 'vite-plugin-electron/simple';
let apiPlugin = (): Plugin => ({
  name: 'api-server-plugin-placeholder'
});

export default defineConfig(async ({command, mode}) => {
  if (command === 'serve') {
    // Only import server in dev to avoid better-sqlite3 native errors during frontend builds
    try {
      const serverPath = './server/index.js';
      const { app } = await import(serverPath);
      apiPlugin = (): Plugin => ({
        name: 'api-server-plugin',
        configureServer(server) {
          server.middlewares.use(app);
        },
      });
    } catch (e: any) {
      console.warn("Could not load backend API server:", e.message);
    }
  }

  const env = loadEnv(mode, '.', '');
  return {
    base: './',
    plugins: [
      react(), 
      tailwindcss(), 
      apiPlugin(),
      electron({
        main: {
          entry: 'electron/main.ts',
        },
        preload: {
          input: path.join(__dirname, 'electron/preload.ts'),
        },
        renderer: {}
      })
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});

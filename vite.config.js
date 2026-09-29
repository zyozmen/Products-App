import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  let productsApiTarget = 'http://localhost:8080';

  try {
    productsApiTarget = new URL(env.VITE_APP_PRODUCTS_API_URL || 'http://localhost:8080').origin;
  } catch {
  }

  return {
    plugins: [react()],
    server: {
      port: 4200,
      open: true,
      proxy: {
        '/api': {
          target: productsApiTarget,
          changeOrigin: true,
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyRequest) => {
              proxyRequest.removeHeader('origin');
            });
          },
        },
      },
    },
    build: {
      outDir: 'build',
    },
    define: {
      __APP_ENV__: JSON.stringify(env.APP_ENV || mode),
    },
    test: {
      globals: true,
      environment: 'happy-dom',
      setupFiles: './src/setupTests.js',
    },
  };
});
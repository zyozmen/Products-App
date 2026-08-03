import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    server: {
      port: 4200,
      open: true,
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
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// ES Module'de __dirname yok, fileURLToPath ile oluşturuyoruz
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: [
        // Daha spesifik alias'lar önce gelmeli
        {
          find: '@/modules',
          replacement: path.resolve(__dirname, './src/modules'),
        },
        {
          find: '@/pages',
          replacement: path.resolve(__dirname, './src/pages'),
        },
        {
          find: '@/types',
          replacement: path.resolve(__dirname, './src/types'),
        },
        {
          find: '@/shared',
          replacement: path.resolve(__dirname, './src/shared'),
        },
        {
          find: '@/components',
          replacement: path.resolve(__dirname, './src/components'),
        },
        {
          find: '@',
          replacement: path.resolve(__dirname, '.'),
        },
      ],
      extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json'],
      mainFields: ['module', 'jsnext:main', 'jsnext'],
    },
    optimizeDeps: {
      include: ['react', 'react-dom'],
    },
    ssr: {
      noExternal: ['@supabase/ssr'],
    },
    build: {
      target: 'es2022',
    },


  };
});

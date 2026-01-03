import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// ES Module'de __dirname yok, fileURLToPath ile oluşturuyoruz
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



// Vite plugin: Next.js paketlerini ignore et
function ignoreNextPlugin(): Plugin {
  return {
    name: 'ignore-next',
    enforce: 'pre',
    resolveId(id, importer) {
      // Next.js paketlerini ignore et - daha kapsamlı kontrol
      if (id === 'next' || id.startsWith('next/')) {
        const stubPath = path.resolve(__dirname, 'vite-next-stub.js');
        console.log(`[ignoreNextPlugin] Redirecting "${id}" to stub:`, stubPath);
        return { id: stubPath, external: false };
      }
      return null;
    },
  };
}



export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');



  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      fs: {
        // app/ klasörünü ve middleware.ts'yi ignore et (Next.js için)
        deny: ['**/app/**', '**/middleware.ts'],
      },
    },
    plugins: [ignoreNextPlugin(), react()],
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
          find: '@/shared',
          replacement: path.resolve(__dirname, './src/shared'),
        },
        {
          find: '@',
          replacement: path.resolve(__dirname, '.'),
        },
      ],
      extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json'],
      mainFields: ['module', 'jsnext:main', 'jsnext'],
      // Next.js paketlerini resolve etme
      conditions: [],
    },
    optimizeDeps: {
      exclude: ['next', 'next/server', 'next/headers', 'next/cache', 'next/navigation'],
      include: ['react', 'react-dom'],
    },
    ssr: {
      noExternal: ['@supabase/ssr'],
      external: ['next', 'next/server', 'next/headers', 'next/cache', 'next/navigation'],
    },


  };
});

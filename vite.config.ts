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
      alias: {
        '@': path.resolve(__dirname, '.'),
        // Next.js paketlerini boş modüle yönlendir (Vite bunları işlemesin)
        'next': path.resolve(__dirname, 'vite-next-stub.js'),
        'next/server': path.resolve(__dirname, 'vite-next-stub.js'),
        'next/headers': path.resolve(__dirname, 'vite-next-stub.js'),
        'next/cache': path.resolve(__dirname, 'vite-next-stub.js'),
        'next/navigation': path.resolve(__dirname, 'vite-next-stub.js'),
      },
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

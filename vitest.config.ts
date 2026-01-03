import { defineConfig } from 'vitest/config'
import path from 'path'
import { fileURLToPath } from 'url'
import react from '@vitejs/plugin-react'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  plugins: [react() as any],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/shared/test-utils/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/shared/test-utils/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/dist/',
        '**/build/',
        '**/.next/',
        '**/coverage/',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        '**/__tests__/',
        'vite-next-stub.js',
        'app/',
        'components/',
        'contexts/',
        'actions/',
        'src/api/',
        'src/hooks/',
        'src/lib/',
        'src/pages/',
        'src/components/',
        'types.ts',
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },
  },
  resolve: {
    alias: [
      {
        find: 'react',
        replacement: path.resolve(__dirname, 'node_modules/react'),
      },
      {
        find: 'react-dom',
        replacement: path.resolve(__dirname, 'node_modules/react-dom'),
      },
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
  },
})


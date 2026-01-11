import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      // Module boundary enforcement - prevent direct access to internal module files
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/modules/*/api/*', '!@/modules/*/api/index'],
              message: 'Import from module index.ts instead of internal API files. Example: import { fn } from "@/modules/booking" instead of "@/modules/booking/api/booking.api"'
            },
            {
              group: ['@/modules/*/hooks/*', '!@/modules/*/hooks/index'],
              message: 'Import from module index.ts instead of internal hook files. Example: import { useHook } from "@/modules/booking" instead of "@/modules/booking/hooks/useBooking"'
            },
            {
              group: ['@/modules/*/services/*', '!@/modules/*/services/index'],
              message: 'Import from module index.ts instead of internal service files. Example: import { service } from "@/modules/booking" instead of "@/modules/booking/services/service"'
            },
            {
              group: ['@/modules/*/components/*', '!@/modules/*/components/index'],
              message: 'Import from module index.ts instead of internal component files, unless the component is explicitly exported from module index.ts'
            },
            // Deprecated shared services - use domain modules instead
            {
              group: ['@/shared/services/*'],
              message: 'Shared services are deprecated. Use @/modules/auth for checkAdmin.'
            },
            // Deprecated shared hooks - use domain modules instead
            {
              group: ['@/shared/hooks/*'],
              message: 'Shared hooks are deprecated. Import from domain modules (e.g., @/modules/auth for useAdminCheck).'
            },
            // Deprecated global types - use domain modules instead
            {
              group: ['@/types/domain'],
              message: 'Global domain types are deprecated. Import types from domain modules (@/modules/event, @/modules/booking, @/modules/profile, @/modules/ticket).'
            }
          ]
        }
      ],
      // Disable some strict rules for gradual adoption
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      // Typography standardization - prefer custom scale over raw Tailwind
      // Note: This is a warning to encourage migration, not an error
      'no-restricted-syntax': [
        'warn',
        {
          selector: 'Literal[value=/^text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)$/]',
          message: 'Use custom typography scale (text-h1, text-body, text-label, etc.) instead of raw Tailwind typography classes. See docs/DESIGN_SYSTEM.md for available typography tokens.'
        },
        {
          selector: 'TemplateLiteral',
          message: 'Avoid arbitrary Tailwind values in template literals. Use design system tokens instead. For dynamic values, use CSS variables pattern.'
        }
      ]
    }
  },
  {
    ignores: ['node_modules/**', 'dist/**', '*.config.js', '*.config.ts']
  }
);

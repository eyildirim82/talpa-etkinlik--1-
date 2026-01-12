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
      // Design System Token Enforcement
      // Typography standardization - prefer custom scale over raw Tailwind
      'no-restricted-syntax': [
        'error',
        {
          // Raw Tailwind typography scale classes
          selector: 'Literal[value=/^text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)$/]',
          message: 'Use custom typography scale (text-h1, text-body, text-label, etc.) instead of raw Tailwind typography classes. See docs/DESIGN_SYSTEM.md for available typography tokens.'
        },
        {
          // Arbitrary typography values in template literals
          selector: 'TemplateLiteral > TemplateElement[value.raw=/\\btext-\\[\\d+px\\]/]',
          message: 'Arbitrary typography values are forbidden. Use typography scale tokens (text-h1, text-body, text-label, etc.). See docs/DESIGN_SYSTEM.md for available typography tokens.'
        },
        {
          // Hardcoded gray colors in template literals
          selector: 'TemplateLiteral > TemplateElement[value.raw=/\\b(bg|text|border)-gray-\\d+/]',
          message: 'Hardcoded gray colors are forbidden. Use semantic tokens (bg-ui-background, text-text-primary, border-ui-border, etc.). See docs/DESIGN_SYSTEM.md for available color tokens.'
        },
        {
          // Hardcoded color classes in template literals (extended to other colors)
          selector: 'TemplateLiteral > TemplateElement[value.raw=/\\b(bg|text|border)-(blue|red|green|yellow|purple|pink|indigo|emerald|teal|cyan|sky|violet|fuchsia|rose|orange|amber|lime|stone|neutral|zinc|slate)-(50|100|200|300|400|500|600|700|800|900)\\b/]',
          message: 'Hardcoded Tailwind color classes are forbidden. Use semantic tokens (bg-ui-background, text-text-primary, border-ui-border, bg-state-success, etc.). See docs/DESIGN_SYSTEM.md for available color tokens.'
        },
        {
          // Arbitrary z-index values
          selector: 'TemplateLiteral > TemplateElement[value.raw=/\\bz-\\[\\d+\\]/]',
          message: 'Arbitrary z-index values are forbidden. Use semantic z-index tokens (z-modal, z-overlay, z-toast, etc.). See docs/DESIGN_SYSTEM.md for available z-index tokens.'
        },
        {
          // Hardcoded gray colors in JSX className attributes
          selector: 'JSXAttribute[name.name="className"] > JSXExpressionContainer > TemplateLiteral > TemplateElement[value.raw=/\\b(bg|text|border)-gray-\\d+/]',
          message: 'Hardcoded gray colors are forbidden. Use semantic tokens (bg-ui-background, text-text-primary, border-ui-border, etc.). See docs/DESIGN_SYSTEM.md for available color tokens.'
        },
        {
          // Hardcoded color classes in JSX className attributes
          selector: 'JSXAttribute[name.name="className"] > JSXExpressionContainer > TemplateLiteral > TemplateElement[value.raw=/\\b(bg|text|border)-(blue|red|green|yellow|purple|pink|indigo|emerald|teal|cyan|sky|violet|fuchsia|rose|orange|amber|lime|stone|neutral|zinc|slate)-(50|100|200|300|400|500|600|700|800|900)\\b/]',
          message: 'Hardcoded Tailwind color classes are forbidden. Use semantic tokens (bg-ui-background, text-text-primary, border-ui-border, bg-state-success, etc.). See docs/DESIGN_SYSTEM.md for available color tokens.'
        },
        {
          // Arbitrary typography in JSX className attributes
          selector: 'JSXAttribute[name.name="className"] > JSXExpressionContainer > TemplateLiteral > TemplateElement[value.raw=/\\btext-\\[\\d+px\\]/]',
          message: 'Arbitrary typography values are forbidden. Use typography scale tokens (text-h1, text-body, text-label, etc.). See docs/DESIGN_SYSTEM.md for available typography tokens.'
        },
        {
          // Arbitrary z-index in JSX className attributes
          selector: 'JSXAttribute[name.name="className"] > JSXExpressionContainer > TemplateLiteral > TemplateElement[value.raw=/\\bz-\\[\\d+\\]/]',
          message: 'Arbitrary z-index values are forbidden. Use semantic z-index tokens (z-modal, z-overlay, z-toast, etc.). See docs/DESIGN_SYSTEM.md for available z-index tokens.'
        },
        {
          // Raw Tailwind typography in JSX className string literals
          selector: 'JSXAttribute[name.name="className"] > Literal[value=/\\btext-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)\\b/]',
          message: 'Use custom typography scale (text-h1, text-body, text-label, etc.) instead of raw Tailwind typography classes. See docs/DESIGN_SYSTEM.md for available typography tokens.'
        }
      ]
      // Note: Inline style enforcement would require react plugin
      // For now, manual code review should catch static inline styles
      // Dynamic inline styles (e.g., style={{ width: `${progress}%` }}) are acceptable
    }
  },
  {
    ignores: ['node_modules/**', 'dist/**', '*.config.js', '*.config.ts']
  }
);

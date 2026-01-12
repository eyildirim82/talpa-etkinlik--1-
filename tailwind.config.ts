import { tokens } from './src/shared/design-tokens/index';

// Helper function to convert fontSize tokens to Tailwind format
function formatFontSize(token: string | { fontSize: string; lineHeight?: string; fontWeight?: string }): [string, { lineHeight?: string; fontWeight?: string }] {
  if (typeof token === 'string') {
    return [token, {}];
  }
  return [token.fontSize, { 
    lineHeight: token.lineHeight, 
    fontWeight: token.fontWeight 
  }];
}

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        display: ['Inter', 'sans-serif'],
      },
      fontSize: {
        // Display (hero, landing) - from design tokens
        'display-1': ['4rem', { lineHeight: '1.1', fontWeight: '700' }],
        'display-2': ['3rem', { lineHeight: '1.2', fontWeight: '600' }],
        'display-3': ['6rem', { lineHeight: '1.1', fontWeight: '700' }], // For large hero sections
        // Headings - from design tokens
        'h1': ['2.5rem', { lineHeight: '1.3', fontWeight: '600' }],
        'h2': ['2rem', { lineHeight: '1.4', fontWeight: '600' }],
        'h3': ['1.5rem', { lineHeight: '1.5', fontWeight: '500' }],
        'h4': ['1.25rem', { lineHeight: '1.5', fontWeight: '500' }],
        // Body - from design tokens
        'body-lg': ['1.125rem', { lineHeight: '1.6' }],
        'body': ['1rem', { lineHeight: '1.6' }],
        'body-sm': ['0.875rem', { lineHeight: '1.5' }],
        // UI - from design tokens
        'label': ['0.875rem', { lineHeight: '1.4', fontWeight: '500' }],
        'caption': ['0.75rem', { lineHeight: '1.4' }],
        '2xs': ['0.625rem', { lineHeight: '1.4' }], // 10px - For very small text
      },
      colors: {
        // Semantic brand colors - from design tokens
        brand: tokens.colors.brand,
        // Semantic UI colors - from design tokens
        ui: tokens.colors.ui,
        // Semantic text colors - from design tokens
        text: tokens.colors.text,
        // Semantic state colors - from design tokens
        state: tokens.colors.state,
        // Interactive states - from design tokens
        interactive: tokens.colors.interactive,
        // Legacy support (deprecated, migrate gradually)
        // These are kept for backward compatibility but should not be used in new code
        primary: tokens.colors.brand.primary,
        secondary: tokens.colors.brand.secondary,
        accent: tokens.colors.brand.accent,
        'soft-gray': '#f4f4f4',
        surface: tokens.colors.ui.surface,
        background: tokens.colors.ui.background,
        'border-subtle': tokens.colors.ui.border.subtle,
        'text-main': tokens.colors.text.primary,
        'text-muted': tokens.colors.text.muted,
        'accent-light': '#fcfcfc',
        talpa: {
          bg: '#F9FAFB',
          card: '#FFFFFF',
          text: {
            main: '#111827',
            secondary: '#6B7280',
            light: '#9CA3AF',
          },
          border: '#E5E7EB',
          primary: '#EF4444',
          secondary: '#1F2937',
          success: '#10B981',
          warning: '#F59E0B',
          danger: '#EF4444',
          gold: '#D4AF37',
        },
      },
      boxShadow: {
        // From design tokens
        none: tokens.shadows.none,
        sm: tokens.shadows.sm,
        subtle: tokens.shadows.subtle,
        md: tokens.shadows.md,
        hover: tokens.shadows.hover,
        lg: tokens.shadows.lg,
        xl: tokens.shadows.xl,
        'gold-glow': tokens.shadows['gold-glow'],
        // Elevation system
        'elevation-0': tokens.elevation[0],
        'elevation-1': tokens.elevation[1],
        'elevation-2': tokens.elevation[2],
        'elevation-3': tokens.elevation[3],
      },
      backgroundImage: {
        'gradient-admin': 'linear-gradient(135deg, #0A1929 0%, #0D2137 100%)',
        'gradient-admin-card': 'linear-gradient(135deg, rgba(13, 33, 55, 0.8) 0%, rgba(10, 25, 41, 0.9) 100%)',
        'gradient-gold': 'linear-gradient(135deg, #D4AF37 0%, #C9A227 100%)',
      },
      textShadow: {
        // From design tokens
        'hero': tokens.textShadow.hero,
      },
      borderRadius: {
        // From design tokens
        'none': tokens.borderRadius.none,
        'sm': tokens.borderRadius.sm,
        'md': tokens.borderRadius.md,
        'lg': tokens.borderRadius.lg,
        'xl': tokens.borderRadius.xl,
        '2xl': tokens.borderRadius['2xl'],
        '3xl': tokens.borderRadius['3xl'],
        'full': tokens.borderRadius.full,
      },
      zIndex: {
        // Semantic z-index tokens - from design system
        dropdown: 1000,
        sticky: 1020,
        overlay: 1040,
        modal: 1050,
        toast: 1100,
        tooltip: 1200,
      },
      transitionDuration: {
        // Motion duration tokens - from design tokens
        fast: tokens.motion.duration.fast,
        normal: tokens.motion.duration.normal,
        slow: tokens.motion.duration.slow,
      },
      transitionTimingFunction: {
        // Motion easing tokens - from design tokens
        'motion-default': tokens.motion.easing.default,
        'motion-bounce': tokens.motion.easing.bounce,
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
  ],
}

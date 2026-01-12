/**
 * Design Tokens
 * 
 * Centralized design tokens for the TALPA platform.
 * These tokens are the single source of truth for colors, spacing, typography, etc.
 * 
 * Usage:
 * - In JavaScript/TypeScript: import { tokens } from '@/shared/design-tokens'
 * - In Tailwind: Use the semantic class names (e.g., bg-brand-primary, text-text-primary)
 */

export const tokens = {
  colors: {
    brand: {
      primary: '#111111',
      secondary: '#555555',
      accent: '#ea2a33',
      gold: '#D4AF37',
      'gold-hover': '#C9A227',
      pink: '#ea2a33', // Same as accent for featured events
      purple: '#8B5CF6', // For pricing display
    },
    ui: {
      surface: '#ffffff',
      background: '#f8f9fa',
      'background-dark': '#0A1929',
      'background-dark-alt': '#0D2137',
      border: {
        DEFAULT: '#E5E7EB',
        subtle: '#eff1f3',
        strong: '#1a1a1a',
      },
    },
    text: {
      primary: '#1a1a1a',
      secondary: '#6B7280',
      muted: '#888888',
      disabled: '#9CA3AF',
      inverse: '#E5E5E5',
      'inverse-muted': 'rgba(229, 229, 229, 0.5)',
    },
    state: {
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#3B82F6',
      // Semantic status colors with full palette
      'success-bg': '#D1FAE5',
      'success-text': '#065F46',
      'success-border': '#10B981',
      'warning-bg': '#FEF3C7',
      'warning-text': '#92400E',
      'warning-border': '#F59E0B',
      'error-bg': '#FEE2E2',
      'error-text': '#991B1B',
      'error-border': '#EF4444',
      'info-bg': '#DBEAFE',
      'info-text': '#1E40AF',
      'info-border': '#3B82F6',
    },
    interactive: {
      hover: {
        surface: 'rgba(0,0,0,0.02)',
        border: 'rgba(0,0,0,0.1)',
        text: 'rgba(0,0,0,0.8)',
      },
      focus: {
        ring: 'rgba(234, 42, 51, 0.2)', // brand-accent/20
        border: '#ea2a33',
      },
      active: {
        surface: 'rgba(0,0,0,0.05)',
      },
      disabled: {
        opacity: 0.5,
        cursor: 'not-allowed',
      },
    },
  },
  spacing: {
    // Tailwind default spacing scale (0.25rem = 4px base unit)
    // Use Tailwind classes: p-4, gap-6, etc.
    // Common spacing values:
    xs: '0.25rem', // 4px
    sm: '0.5rem', // 8px
    md: '1rem', // 16px
    lg: '1.5rem', // 24px
    xl: '2rem', // 32px
    '2xl': '2.5rem', // 40px
    '3xl': '3rem', // 48px
  },
  typography: {
    fontSize: {
      'display-1': '4rem', // 64px
      'display-2': '3rem', // 48px
      'display-3': '6rem', // 96px - For large hero sections
      h1: '2.5rem', // 40px
      h2: '2rem', // 32px
      h3: '1.5rem', // 24px
      h4: '1.25rem', // 20px
      'body-lg': '1.125rem', // 18px
      body: '1rem', // 16px
      'body-sm': '0.875rem', // 14px
      label: '0.875rem', // 14px
      caption: '0.75rem', // 12px
      '2xs': '0.625rem', // 10px - For very small text (badges, labels)
    },
    lineHeight: {
      tight: '1.1',
      normal: '1.2',
      relaxed: '1.4',
      loose: '1.5',
      'body-loose': '1.6',
    },
    fontWeight: {
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },
  shadows: {
    none: 'none',
    sm: '0 1px 2px rgba(0,0,0,0.05)',
    subtle: '0 2px 10px rgba(0,0,0,0.02)',
    md: '0 2px 10px rgba(0,0,0,0.02)',
    hover: '0 10px 40px rgba(0,0,0,0.04)',
    lg: '0 10px 40px rgba(0,0,0,0.04)',
    xl: '0 20px 60px rgba(0,0,0,0.08)',
    'gold-glow': '0 8px 25px rgba(212, 175, 55, 0.25)',
  },
  elevation: {
    0: 'none',
    1: '0 1px 2px rgba(0,0,0,0.05)', // cards
    2: '0 2px 8px rgba(0,0,0,0.08)', // modals
    3: '0 4px 16px rgba(0,0,0,0.12)', // dropdowns
  },
  borderRadius: {
    none: '0',
    sm: '0.25rem', // 4px
    md: '0.5rem', // 8px
    lg: '0.75rem', // 12px
    xl: '1rem', // 16px
    '2xl': '1.5rem', // 24px
    '3xl': '2rem', // 32px
    full: '9999px',
  },
  textShadow: {
    hero: '0 2px 10px rgba(0,0,0,0.3)',
  },
  motion: {
    duration: {
      fast: '150ms',
      normal: '200ms',
      slow: '300ms',
    },
    easing: {
      default: 'ease-in-out',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
  },
} as const;

// Type-safe token access helpers
export type ColorToken = keyof typeof tokens.colors.brand | 
  keyof typeof tokens.colors.ui | 
  keyof typeof tokens.colors.text | 
  keyof typeof tokens.colors.state;

export type SpacingToken = keyof typeof tokens.spacing;
export type TypographyToken = keyof typeof tokens.typography.fontSize;
export type ShadowToken = keyof typeof tokens.shadows;
export type BorderRadiusToken = keyof typeof tokens.borderRadius;
export type MotionDurationToken = keyof typeof tokens.motion.duration;
export type MotionEasingToken = keyof typeof tokens.motion.easing;

/**
 * Get a color value by path
 * Example: getColor('brand.primary') => '#111111'
 */
export function getColor(path: string): string {
  const parts = path.split('.');
  let value: any = tokens.colors;
  for (const part of parts) {
    value = value[part];
    if (!value) {
      throw new Error(`Color token not found: ${path}`);
    }
  }
  return value;
}

/**
 * Get a spacing value
 * Example: getSpacing('md') => '1rem'
 */
export function getSpacing(token: SpacingToken): string {
  return tokens.spacing[token];
}

/**
 * Get a typography font size
 * Example: getFontSize('h1') => '2.5rem'
 */
export function getFontSize(token: TypographyToken): string {
  return tokens.typography.fontSize[token];
}

/**
 * Get a motion duration value
 * Example: getMotionDuration('normal') => '200ms'
 */
export function getMotionDuration(token: MotionDurationToken): string {
  return tokens.motion.duration[token];
}

/**
 * Get a motion easing value
 * Example: getMotionEasing('default') => 'ease-in-out'
 */
export function getMotionEasing(token: MotionEasingToken): string {
  return tokens.motion.easing[token];
}

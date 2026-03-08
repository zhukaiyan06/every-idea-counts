/**
 * Design System - 极简生产力风格
 * Minimal Productivity Aesthetic
 * 
 * Core Principles:
 * - Content-first: Ideas are the hero
 * - Refined minimalism: Every element earns its place
 * - Thoughtful whitespace: Generous breathing room
 * - Typography-driven: Beautiful, readable text
 */

// ============================================
// Color Palette
// ============================================

export const colors = {
  // Light Mode
  light: {
    // Backgrounds
    bg: {
      primary: '#FAFAFA',      // Main background - soft off-white
      secondary: '#FFFFFF',    // Cards, panels
      tertiary: '#F5F5F5',     // Hover states, inputs
      subtle: '#FAFAFA',       // Muted areas
    },
    // Text
    text: {
      primary: '#18181B',      // Main text - high contrast
      secondary: '#52525B',    // Secondary text
      tertiary: '#A1A1AA',     // Muted text
      inverse: '#FFFFFF',      // On dark backgrounds
    },
    // Accent Colors
    accent: {
      primary: '#0D9488',      // Teal - primary action (生成按钮)
      primaryHover: '#0F766E', // Darker teal on hover
      primaryLight: '#CCFBF1', // Light teal for backgrounds
      secondary: '#6366F1',    // Indigo - secondary actions
      secondaryLight: '#EEF2FF',
    },
    // Semantic
    semantic: {
      success: '#10B981',
      successBg: '#D1FAE5',
      warning: '#F59E0B',
      warningBg: '#FEF3C7',
      error: '#EF4444',
      errorBg: '#FEE2E2',
    },
    // Borders
    border: {
      default: '#E4E4E7',
      subtle: '#F4F4F5',
      strong: '#D4D4D8',
    },
  },
  
  // Dark Mode
  dark: {
    bg: {
      primary: '#0A0A0A',      // Near black
      secondary: '#18181B',    // Cards, panels
      tertiary: '#27272A',     // Hover states, inputs
      subtle: '#1F1F23',
    },
    text: {
      primary: '#FAFAFA',
      secondary: '#A1A1AA',
      tertiary: '#71717A',
      inverse: '#18181B',
    },
    accent: {
      primary: '#2DD4BF',      // Brighter teal for dark mode
      primaryHover: '#5EEAD4',
      primaryLight: '#134E4A',
      secondary: '#818CF8',
      secondaryLight: '#312E81',
    },
    semantic: {
      success: '#34D399',
      successBg: '#064E3B',
      warning: '#FBBF24',
      warningBg: '#78350F',
      error: '#F87171',
      errorBg: '#7F1D1D',
    },
    border: {
      default: '#27272A',
      subtle: '#1F1F23',
      strong: '#3F3F46',
    },
  },
} as const

// ============================================
// Typography
// ============================================

export const typography = {
  fontFamily: {
    // Display font for headings - elegant serif
    display: '"Crimson Pro", "Noto Serif SC", Georgia, serif',
    // Body font - clean sans-serif
    body: '"DM Sans", "Noto Sans SC", -apple-system, BlinkMacSystemFont, sans-serif',
    // Monospace for code
    mono: '"JetBrains Mono", "Fira Code", Consolas, monospace',
  },
  
  fontSize: {
    xs: '0.75rem',     // 12px
    sm: '0.875rem',    // 14px
    base: '1rem',      // 16px
    lg: '1.125rem',    // 18px
    xl: '1.25rem',     // 20px
    '2xl': '1.5rem',   // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
  },
  
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
    loose: 2,
  },
  
  letterSpacing: {
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
  },
} as const

// ============================================
// Spacing
// ============================================

export const spacing = {
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
} as const

// ============================================
// Border Radius
// ============================================

export const radius = {
  none: '0',
  sm: '0.25rem',   // 4px
  md: '0.5rem',    // 8px
  lg: '0.75rem',   // 12px
  xl: '1rem',      // 16px
  '2xl': '1.5rem', // 24px
  full: '9999px',
} as const

// ============================================
// Shadows
// ============================================

export const shadows = {
  light: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -1px rgba(0, 0, 0, 0.04)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 10px 10px -5px rgba(0, 0, 0, 0.03)',
  },
  dark: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.3)',
  },
} as const

// ============================================
// Transitions
// ============================================

export const transitions = {
  fast: '150ms ease',
  normal: '200ms ease',
  slow: '300ms ease',
  bounce: '300ms cubic-bezier(0.68, -0.55, 0.265, 1.55)',
} as const

// ============================================
// Z-Index Scale
// ============================================

export const zIndex = {
  base: 0,
  dropdown: 100,
  sticky: 200,
  modal: 300,
  toast: 400,
  tooltip: 500,
} as const

// ============================================
// Component Styles
// ============================================

export const components = {
  button: {
    base: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 500,
      transition: 'all 150ms ease',
      cursor: 'pointer',
      outline: 'none',
    },
    sizes: {
      sm: {
        padding: '0.5rem 1rem',
        fontSize: '0.875rem',
        borderRadius: '0.375rem',
      },
      md: {
        padding: '0.625rem 1.25rem',
        fontSize: '0.9375rem',
        borderRadius: '0.5rem',
      },
      lg: {
        padding: '0.75rem 1.5rem',
        fontSize: '1rem',
        borderRadius: '0.5rem',
      },
    },
    variants: {
      primary: (isDark: boolean) => ({
        background: isDark ? colors.dark.accent.primary : colors.light.accent.primary,
        color: colors.light.text.inverse,
        border: 'none',
        ':hover': {
          background: isDark ? colors.dark.accent.primaryHover : colors.light.accent.primaryHover,
        },
      }),
      secondary: (isDark: boolean) => ({
        background: 'transparent',
        color: isDark ? colors.dark.text.primary : colors.light.text.primary,
        border: `1px solid ${isDark ? colors.dark.border.default : colors.light.border.default}`,
      }),
      ghost: (isDark: boolean) => ({
        background: 'transparent',
        color: isDark ? colors.dark.text.secondary : colors.light.text.secondary,
        border: 'none',
      }),
    },
  },
  
  input: {
    base: (isDark: boolean) => ({
      width: '100%',
      padding: '0.75rem 1rem',
      fontSize: '1rem',
      fontFamily: typography.fontFamily.body,
      lineHeight: 1.5,
      background: isDark ? colors.dark.bg.tertiary : colors.light.bg.secondary,
      color: isDark ? colors.dark.text.primary : colors.light.text.primary,
      border: `1px solid ${isDark ? colors.dark.border.default : colors.light.border.default}`,
      borderRadius: '0.5rem',
      outline: 'none',
      transition: 'border-color 150ms ease, box-shadow 150ms ease',
    }),
  },
  
  card: (isDark: boolean) => ({
    background: isDark ? colors.dark.bg.secondary : colors.light.bg.secondary,
    border: `1px solid ${isDark ? colors.dark.border.default : colors.light.border.default}`,
    borderRadius: '0.75rem',
    padding: '1.5rem',
    boxShadow: isDark ? shadows.dark.sm : shadows.light.sm,
  }),
}

// ============================================
// Breakpoints
// ============================================

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const

// Color palette type that works for both light and dark
export type ColorPalette = {
  bg: {
    primary: string
    secondary: string
    tertiary: string
    subtle: string
  }
  text: {
    primary: string
    secondary: string
    tertiary: string
    inverse: string
  }
  accent: {
    primary: string
    primaryHover: string
    primaryLight: string
    secondary: string
    secondaryLight: string
  }
  semantic: {
    success: string
    successBg: string
    warning: string
    warningBg: string
    error: string
    errorBg: string
  }
  border: {
    default: string
    subtle: string
    strong: string
  }
}

export type ThemeMode = 'light' | 'dark'

export interface Theme {
  mode: ThemeMode
  colors: ColorPalette
  isDark: boolean
}
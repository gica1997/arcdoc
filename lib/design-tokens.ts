// ============================================
// ArcDoc Enterprise 2026 — Design System Tokens
// ============================================

export const colors = {
  // Primary - Indigo
  primary: {
    50: '#eef2ff',
    100: '#e0e7ff',
    200: '#c7d2fe',
    300: '#a5b4fc',
    400: '#818cf8',
    500: '#6366f1',
    600: '#4f46e5',
    700: '#4338ca',
    800: '#3730a3',
    900: '#312e81',
    950: '#1e1b4b',
  },
  // Secondary - Slate
  secondary: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617',
  },
  // Accent - Cyan
  accent: {
    50: '#ecfeff',
    100: '#cffafe',
    200: '#a5f3fc',
    300: '#67e8f9',
    400: '#22d3ee',
    500: '#06b6d4',
    600: '#0891b2',
    700: '#0e7490',
    800: '#155e75',
    900: '#164e63',
    950: '#083344',
  },
  // Success - Emerald
  success: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981',
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
    950: '#022c22',
  },
  // Warning - Amber
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
    950: '#451a03',
  },
  // Danger - Rose
  danger: {
    50: '#fff1f2',
    100: '#ffe4e6',
    200: '#fecdd3',
    300: '#fda4af',
    400: '#fb7185',
    500: '#f43f5e',
    600: '#e11d48',
    700: '#be123c',
    800: '#9f1239',
    900: '#881337',
    950: '#4c0519',
  },
  // Neutrals
  neutral: {
    0: '#ffffff',
    50: '#f8f9fa',
    100: '#f1f3f5',
    200: '#e9ecef',
    300: '#dee2e6',
    400: '#ced4da',
    500: '#adb5bd',
    600: '#868e96',
    700: '#495057',
    800: '#343a40',
    900: '#212529',
    950: '#0d1117',
  },
} as const;

export const typography = {
  fontFamily: {
    sans: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    mono: '"JetBrains Mono", "SF Mono", SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  },
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.8125rem',  // 13px
    base: '0.875rem', // 14px
    md: '0.9375rem',  // 15px
    lg: '1rem',       // 16px
    xl: '1.125rem',   // 18px
    '2xl': '1.25rem', // 20px
    '3xl': '1.5rem',  // 24px
    '4xl': '1.875rem',// 30px
    '5xl': '2.25rem', // 36px
    '6xl': '3rem',    // 48px
  },
  fontWeight: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.625',
  },
  letterSpacing: {
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
  },
} as const;

export const radius = {
  none: '0',
  xs: '0.25rem',   // 4px
  sm: '0.375rem',  // 6px
  md: '0.5rem',    // 8px
  lg: '0.75rem',   // 12px
  xl: '1rem',      // 16px
  '2xl': '1.5rem', // 24px
  full: '9999px',
} as const;

export const shadows = {
  xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  // Premium shadows with colored undertones
  primary: '0 4px 14px 0 rgb(99 102 241 / 0.35)',
  accent: '0 4px 14px 0 rgb(6 182 212 / 0.35)',
  glass: '0 8px 32px 0 rgb(0 0 0 / 0.08)',
  // Dark mode shadows
  dark: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.3)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.4)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.4)',
    glass: '0 8px 32px 0 rgb(0 0 0 / 0.3)',
  },
} as const;

export const spacing = {
  0: '0',
  px: '1px',
  0.5: '0.125rem',
  1: '0.25rem',
  1.5: '0.375rem',
  2: '0.5rem',
  2.5: '0.625rem',
  3: '0.75rem',
  3.5: '0.875rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  7: '1.75rem',
  8: '2rem',
  9: '2.25rem',
  10: '2.5rem',
  12: '3rem',
  14: '3.5rem',
  16: '4rem',
  20: '5rem',
  24: '6rem',
} as const;

export const breakpoints = {
  xs: '36em',   // 576px
  sm: '48em',   // 768px
  md: '62em',   // 992px
  lg: '75em',   // 1200px
  xl: '88em',   // 1408px
  '2xl': '96em',// 1536px
} as const;

export const animation = {
  duration: {
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
    slower: '400ms',
    slowest: '500ms',
  },
  easing: {
    linear: 'linear',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    // Premium easings
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    smooth: 'cubic-bezier(0.65, 0, 0.35, 1)',
    decelerate: 'cubic-bezier(0, 0, 0.2, 1.25)',
  },
  keyframes: {
    fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
    fadeInUp: { from: { opacity: 0, transform: 'translateY(12px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
    slideInRight: { from: { opacity: 0, transform: 'translateX(16px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
    slideInLeft: { from: { opacity: 0, transform: 'translateX(-16px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
    scaleIn: { from: { opacity: 0, transform: 'scale(0.95)' }, to: { opacity: 1, transform: 'scale(1)' } },
    shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
    pulse: { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.5 } },
  },
} as const;

export const glass = {
  light: {
    background: 'rgba(255, 255, 255, 0.72)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.08)',
  },
  dark: {
    background: 'rgba(30, 41, 59, 0.72)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
  },
} as const;

export const zIndex = {
  base: 0,
  dropdown: 100,
  sticky: 200,
  navbar: 300,
  modal: 400,
  popover: 500,
  tooltip: 600,
  notification: 700,
  commandPalette: 800,
  overlay: 900,
} as const;

// Sidebar configuration
export const sidebar = {
  width: 280,
  collapsedWidth: 68,
  topbarHeight: 56,
  transition: 'width 200ms cubic-bezier(0.4, 0, 0.2, 1)',
} as const;

// The complete ArcDoc theme for Mantine v8
export const arcdocTheme = {
  primaryColor: 'arcdoc-primary',
  primaryShade: { light: 5, dark: 7 },
  fontFamily: typography.fontFamily.sans,
  fontFamilyMonospace: typography.fontFamily.mono,
  defaultRadius: 'md',
  respectReducedMotion: true,
  cursorType: 'pointer',
  colors: {
    'arcdoc-primary': [
      colors.primary[50], colors.primary[100], colors.primary[200], colors.primary[300],
      colors.primary[400], colors.primary[500], colors.primary[600], colors.primary[700],
      colors.primary[800], colors.primary[900],
    ],
    'arcdoc-secondary': [
      colors.secondary[50], colors.secondary[100], colors.secondary[200], colors.secondary[300],
      colors.secondary[400], colors.secondary[500], colors.secondary[600], colors.secondary[700],
      colors.secondary[800], colors.secondary[900],
    ],
    'arcdoc-accent': [
      colors.accent[50], colors.accent[100], colors.accent[200], colors.accent[300],
      colors.accent[400], colors.accent[500], colors.accent[600], colors.accent[700],
      colors.accent[800], colors.accent[900],
    ],
    'arcdoc-success': [
      colors.success[50], colors.success[100], colors.success[200], colors.success[300],
      colors.success[400], colors.success[500], colors.success[600], colors.success[700],
      colors.success[800], colors.success[900],
    ],
    'arcdoc-warning': [
      colors.warning[50], colors.warning[100], colors.warning[200], colors.warning[300],
      colors.warning[400], colors.warning[500], colors.warning[600], colors.warning[700],
      colors.warning[800], colors.warning[900],
    ],
    'arcdoc-danger': [
      colors.danger[50], colors.danger[100], colors.danger[200], colors.danger[300],
      colors.danger[400], colors.danger[500], colors.danger[600], colors.danger[700],
      colors.danger[800], colors.danger[900],
    ],
  },
  fontSizes: {
    xs: typography.fontSize.xs,
    sm: typography.fontSize.sm,
    md: typography.fontSize.base,
    lg: typography.fontSize.md,
    xl: typography.fontSize.lg,
  },
  lineHeights: {
    xs: typography.lineHeight.tight,
    sm: typography.lineHeight.tight,
    md: typography.lineHeight.normal,
    lg: typography.lineHeight.normal,
    xl: typography.lineHeight.relaxed,
  },
  radius: {
    xs: radius.xs,
    sm: radius.sm,
    md: radius.md,
    lg: radius.lg,
    xl: radius.xl,
  },
  shadows: {
    xs: shadows.xs,
    sm: shadows.sm,
    md: shadows.md,
    lg: shadows.lg,
    xl: shadows.xl,
  },
  spacing: {
    xs: spacing[2],
    sm: spacing[3],
    md: spacing[4],
    lg: spacing[6],
    xl: spacing[8],
  },
  breakpoints: {
    xs: breakpoints.xs,
    sm: breakpoints.sm,
    md: breakpoints.md,
    lg: breakpoints.lg,
    xl: breakpoints.xl,
  },
  headings: {
    fontFamily: typography.fontFamily.sans,
    fontWeight: typography.fontWeight.semibold,
    sizes: {
      h1: { fontSize: typography.fontSize['5xl'], lineHeight: typography.lineHeight.tight },
      h2: { fontSize: typography.fontSize['4xl'], lineHeight: typography.lineHeight.tight },
      h3: { fontSize: typography.fontSize['3xl'], lineHeight: typography.lineHeight.tight },
      h4: { fontSize: typography.fontSize['2xl'], lineHeight: typography.lineHeight.tight },
      h5: { fontSize: typography.fontSize.xl, lineHeight: typography.lineHeight.tight },
      h6: { fontSize: typography.fontSize.lg, lineHeight: typography.lineHeight.tight },
    },
  },
  other: {
    colors,
    radius,
    shadows,
    spacing,
    breakpoints,
    animation,
    glass,
    zIndex,
    sidebar,
  },
} as const;

export default arcdocTheme;

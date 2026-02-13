/**
 * Professional Dark Theme with WCAG AAA Accessibility Compliance
 * Optimized for the Notary verification interface
 */

export const theme = {
  colors: {
    background: {
      primary: '#0a0e1a',
      secondary: '#141824',
      tertiary: '#1e2433',
      elevated: '#252d42',
    },

    text: {
      primary: '#f0f4f8',
      secondary: '#b8c5d6',
      tertiary: '#8a9bb0',
      disabled: '#5a6b82',
    },

    brand: {
      primary: '#8b5cf6',      // Purple for Notary
      primaryHover: '#7c3aed',
      primaryActive: '#6d28d9',
      secondary: '#06b6d4',    // Cyan accent
      accent: '#f59e0b',       // Amber highlight
    },

    semantic: {
      success: '#10b981',
      successBg: '#064e3b',
      warning: '#f59e0b',
      warningBg: '#78350f',
      error: '#ef4444',
      errorBg: '#7f1d1d',
      info: '#3b82f6',
      infoBg: '#1e3a8a',
    },

    ui: {
      border: '#2d3748',
      borderHover: '#4a5568',
      borderFocus: '#8b5cf6',
      divider: '#1e2433',
      shadow: 'rgba(0, 0, 0, 0.5)',
    },

    status: {
      valid: '#10b981',
      invalid: '#ef4444',
      pending: '#f59e0b',
      unknown: '#6b7280',
    },
  },

  typography: {
    fontFamily: {
      sans: '"Inter", system-ui, sans-serif',
      mono: '"Fira Code", "Cascadia Code", Consolas, monospace',
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
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
    },
  },

  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
  },

  borderRadius: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    full: '9999px',
  },

  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.5)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.3)',
    glow: '0 0 20px rgba(139, 92, 246, 0.3)',
  },

  transitions: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    normal: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '500ms cubic-bezier(0.4, 0, 0.2, 1)',
  },

  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
  },
};

export type Theme = typeof theme;

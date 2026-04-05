import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  safelist: [
    // Force generation of custom color utilities
    'text-text-primary', 'text-text-secondary', 'text-text-tertiary',
    'bg-surface', 'bg-surface-alt', 'bg-surface-secondary',
    'border-border', 'border-border-light',
    'hover:bg-surface-secondary', 'hover:text-text-secondary',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Basis Grotesque Pro', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Helvetica Neue', 'sans-serif'],
      },
      colors: {
        // Primary brand color
        primary: '#111827',

        // Neutral grays - use CSS variables for dark mode support
        surface: 'var(--surface)',
        'surface-alt': 'var(--surface-2)',
        'surface-secondary': 'var(--surface-2)',

        // Text semantic colors - use CSS variables for dark mode
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-tertiary': 'var(--text-tertiary)',

        // Borders - use CSS variables
        border: 'var(--border)',
        'border-light': 'var(--border)',

        // Semantic colors
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',
      },
      spacing: {
        'xs': '0.25rem',
        'sm': '0.5rem',
        'md': '1rem',
        'lg': '1.5rem',
        'xl': '2rem',
        '2xl': '2.5rem',
        '3xl': '3rem',
      },
      fontSize: {
        'caption': ['12px', { lineHeight: '1.4', fontWeight: '400' }],
        'label': ['12px', { lineHeight: '1.4', fontWeight: '500' }],
        'body-sm': ['14px', { lineHeight: '1.5', fontWeight: '400' }],
        'body': ['14px', { lineHeight: '1.6', fontWeight: '400' }],
        'body-lg': ['16px', { lineHeight: '1.6', fontWeight: '400' }],
        'heading-sm': ['14px', { lineHeight: '1.5', fontWeight: '600' }],
        'heading': ['16px', { lineHeight: '1.5', fontWeight: '600' }],
        'heading-lg': ['18px', { lineHeight: '1.5', fontWeight: '600' }],
        'heading-xl': ['20px', { lineHeight: '1.4', fontWeight: '600' }],
      },
      strokeWidth: {
        '1': '1px',
        '1.5': '1.5px',
        '2': '2px',
      },
      backgroundColor: {
        light: {
          primary: '#ffffff',
          secondary: '#F9FAFB',
          tertiary: '#F3F4F6',
        },
        dark: {
          primary: '#0F172A',
          secondary: '#1E293B',
          tertiary: '#334155',
        },
      },
    },
  },
  plugins: [],
}

export default config

import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Basis Grotesque Pro', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Helvetica Neue', 'sans-serif'],
      },
      colors: {
        // Primary brand color
        primary: '#111827',

        // Neutral grays - using CSS variables for dark mode
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        'surface-alt': 'rgb(var(--color-surface-alt) / <alpha-value>)',
        'surface-secondary': 'rgb(var(--color-surface-secondary) / <alpha-value>)',

        // Text colors - using CSS variables for dark mode
        'text-primary': 'rgb(var(--color-text-primary) / <alpha-value>)',
        'text-secondary': 'rgb(var(--color-text-secondary) / <alpha-value>)',
        'text-tertiary': 'rgb(var(--color-text-tertiary) / <alpha-value>)',

        // Borders - using CSS variables for dark mode
        border: 'rgb(var(--color-border) / <alpha-value>)',
        'border-light': 'rgb(var(--color-border-light) / <alpha-value>)',

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
    },
  },
  plugins: [],
}

export default config

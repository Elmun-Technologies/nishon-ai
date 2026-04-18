import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  safelist: [
    'text-text-primary', 'text-text-secondary', 'text-text-tertiary',
    'bg-surface', 'bg-surface-2', 'bg-surface-elevated',
    'border-border',
    'hover:bg-surface-2', 'hover:text-text-primary',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Basis Grotesque Pro', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Helvetica Neue', 'sans-serif'],
      },
      colors: {
        // CSS variable based — auto-switch light/dark
        surface:          'var(--c-surface)',
        'surface-2':      'var(--c-surface-2)',
        'surface-secondary': 'var(--c-surface-2)',
        'surface-elevated': 'var(--c-surface-elevated)',
        border:           'var(--c-border)',
        'text-primary':   'var(--c-text-primary)',
        'text-secondary': 'var(--c-text-secondary)',
        'text-tertiary':  'var(--c-text-tertiary)',

        // Brand
        primary:  'var(--c-primary)',
        accent:   '#111827',
        success:  '#10B981',
        warning:  '#F59E0B',
        error:    '#EF4444',
        info:     '#3B82F6',
      },
      fontSize: {
        'caption':    ['12px', { lineHeight: '1.4', fontWeight: '400' }],
        'label':      ['12px', { lineHeight: '1.4', fontWeight: '500' }],
        'body-sm':    ['14px', { lineHeight: '1.5', fontWeight: '400' }],
        'body':       ['14px', { lineHeight: '1.6', fontWeight: '400' }],
        'body-lg':    ['16px', { lineHeight: '1.6', fontWeight: '400' }],
        'heading-sm': ['14px', { lineHeight: '1.5', fontWeight: '600' }],
        'heading':    ['16px', { lineHeight: '1.5', fontWeight: '600' }],
        'heading-lg': ['18px', { lineHeight: '1.5', fontWeight: '600' }],
        'heading-xl': ['20px', { lineHeight: '1.4', fontWeight: '600' }],
      },
    },
  },
  plugins: [],
}

export default config

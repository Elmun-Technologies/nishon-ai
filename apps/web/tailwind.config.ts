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

        // Neutral grays - with dark mode variants
        surface: {
          light: '#ffffff',
          dark: '#0F172A',
        },
        'surface-alt': {
          light: '#F9FAFB',
          dark: '#1A202C',
        },
        'surface-secondary': {
          light: '#F3F4F6',
          dark: '#1E293B',
        },

        // Text colors - with dark mode variants
        'text-primary': {
          light: '#111827',
          dark: '#F1F5F9',
        },
        'text-secondary': {
          light: '#6B7280',
          dark: '#CBD5E1',
        },
        'text-tertiary': {
          light: '#9CA3AF',
          dark: '#94A3B8',
        },

        // Borders - with dark mode variants
        border: {
          light: '#E5E7EB',
          dark: '#334155',
        },
        'border-light': {
          light: '#F3F4F6',
          dark: '#475569',
        },

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

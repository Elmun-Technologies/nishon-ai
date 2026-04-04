import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Primary brand color
        primary: '#111827',

        // Neutral grays
        surface: '#ffffff',
        'surface-alt': '#F9FAFB',
        'surface-secondary': '#F3F4F6',

        // Text colors
        'text-primary': '#111827',
        'text-secondary': '#6B7280',
        'text-tertiary': '#9CA3AF',

        // Borders
        border: '#E5E7EB',
        'border-light': '#F3F4F6',

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

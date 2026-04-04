import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        accent: '#111827',
        surface: '#ffffff',
        'surface-2': '#F9FAFB',
        border: '#E5E7EB',
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

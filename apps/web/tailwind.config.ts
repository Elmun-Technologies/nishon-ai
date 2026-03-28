import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        accent: '#111827',
        surface: '#ffffff',
        'surface-2': '#F9FAFB',
        border: '#E5E7EB',
      },
    },
  },
  plugins: [],
}

export default config

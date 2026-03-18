import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        accent: '#7C3AED',
        surface: '#13131A',
        border: '#2A2A3A',
      },
    },
  },
  plugins: [],
}

export default config
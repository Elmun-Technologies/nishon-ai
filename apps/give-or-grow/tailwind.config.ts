import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0F172A",
        surface: "#1E293B",
        "primary-green": "#22C55E",
        "warning-orange": "#F97316",
        foreground: "#F8FAFC",
        muted: "#94A3B8",
      },
    },
  },
  plugins: [],
};

export default config;

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gym: {
          bg: 'var(--gym-bg)',
          card: 'var(--gym-card)',
          surface: 'var(--gym-surface)',
          hover: 'var(--gym-hover)',
          border: 'var(--gym-border)',
          text: 'var(--gym-text)',
          muted: 'var(--gym-muted)',
          dim: 'var(--gym-dim)',
        },
        brand: {
          DEFAULT: '#E11D48',
          hover: '#BE123C',
          gold: '#F59E0B',
        },
        status: {
          active: {
            DEFAULT: '#00E599',
            bg: 'rgba(0, 229, 153, 0.12)',
            border: '#00E599',
          },
          grace: {
            DEFAULT: '#FFB020',
            bg: 'rgba(255, 176, 32, 0.14)',
            border: '#FFB020',
          },
          expired: {
            DEFAULT: '#FF453A',
            bg: 'rgba(255, 69, 58, 0.14)',
            border: '#FF453A',
          },
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      borderWidth: {
        '3': '3px',
        '4': '4px',
      },
      boxShadow: {
        'brutal-sm': '2px 2px 0px #000000',
        'brutal': '4px 4px 0px #000000',
        'brutal-lg': '6px 6px 0px #000000',
        'brutal-xl': '8px 8px 0px #000000',
        'brutal-pink': '4px 4px 0px #FF5277',
        'brutal-cyan': '4px 4px 0px #00E5D0',
        'brutal-gold': '4px 4px 0px #D4AF37',
        'brutal-green': '4px 4px 0px #22C55E',
      },
      colors: {
        ink: {
          900: '#0b1120',
          800: '#0f172a',
          700: '#1e293b',
          600: '#334155',
        },
        neo: {
          yellow: '#FFE600',
          canary: '#FFF066',
          mint: '#05FFA1',
          teal: '#2DD4BF',
          coral: '#FF5A5F',
          pink: '#FF71CE',
          purple: '#B185FF',
          sky: '#38BDF8',
          paper: '#FFFDF0',
          dark: '#121212',
          gold: '#D4AF37',
          amber: '#F59E0B',
          crt: '#22C55E',
        },
        ivory: {
          50: '#fdfbf7',
          100: '#faf8f2',
          200: '#f4efe4',
          300: '#e8dfcc',
        },
        teal: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
        amber: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Noto Sans Bengali', 'sans-serif'],
        bengali: ['Noto Serif Bengali', 'SolaimanLipi', 'Kalpurush', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
        display: ['Space Grotesk', 'Impact', 'Trebuchet MS', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

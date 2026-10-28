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
        'neu-sm': '3px 3px 8px #c5d0e0, -3px -3px 8px #ffffff',
        'neu-md': '6px 6px 14px #c5d0e0, -6px -6px 14px #ffffff',
        'neu-lg': '10px 10px 22px #c5d0e0, -10px -10px 22px #ffffff',
        'neu-xl': '14px 14px 28px #c5d0e0, -14px -14px 28px #ffffff',
        'neu-inset': 'inset 3px 3px 6px #c5d0e0, inset -3px -3px 6px #ffffff',
        'neu-pressed': 'inset 2px 2px 5px #c5d0e0, inset -2px -2px 5px #ffffff',
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
  plugins: [
    function({ addVariant }) {
      addVariant('high-contrast', ['.high-contrast &', '&.high-contrast', 'body.high-contrast &', 'html.high-contrast &']);
    },
  ],
};

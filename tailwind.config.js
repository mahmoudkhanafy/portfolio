/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        porcelain: '#F9F9FB',
        carbon: {
          DEFAULT: '#111111',
          50: '#F5F5F6',
          100: '#E5E6E8',
          200: '#CCCCCC',
          300: '#999999',
          400: '#666666',
          500: '#333333',
          600: '#222222',
          700: '#1A1A1A',
          800: '#141414',
          900: '#111111',
        },
        'cinema-red': {
          DEFAULT: '#DC2626',
          dark: '#B91C1C',
          light: '#EF4444',
          glow: 'rgba(220, 38, 38, 0.25)'
        },
        editorial: {
          border: '#E5E7EB',
          'border-dark': '#262626',
          muted: '#6B7280',
          canvas: '#F9F9FB',
        }
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'Oswald', 'sans-serif'],
        bebas: ['"Bebas Neue"', 'sans-serif'],
        sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'editorial': '0 20px 40px -15px rgba(0, 0, 0, 0.07)',
        'editorial-hover': '0 25px 50px -12px rgba(220, 38, 38, 0.15)',
        'cinema': '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
        'red-glow': '0 0 30px rgba(220, 38, 38, 0.4)',
      },
      letterSpacing: {
        'ultra-wide': '0.25em',
        'tighter': '-0.04em',
      }
    },
  },
  plugins: [],
}

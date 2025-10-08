/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', 'sans-serif'],
        inter: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace']
      },
      colors: {
        primary: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#7c3aed',
          600: '#6b21a8',
          700: '#5b21b6',
          800: '#4c1d95',
          900: '#3b0764',
        },
        secondary: {
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
        },
        accent: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        success: '#10b981',
        warning: '#fbbf24',
        error: '#ef4444',
      },
      backgroundImage: {
        'primary-gradient': 'linear-gradient(135deg, #6b21a8 0%, #7c3aed 50%, #8b5cf6 100%)',
        'secondary-gradient': 'linear-gradient(135deg, #fbbf24 0%, #fcd34d 100%)',
        'accent-gradient': 'linear-gradient(135deg, #f59e0b 0%, #fb923c 100%)',
        'pastel-gradient': 'linear-gradient(135deg, #6b21a8 0%, #7c3aed 50%, #8b5cf6 100%)',
      },
      boxShadow: {
        'cute': '0 20px 60px rgba(124, 58, 237, 0.2), 0 8px 24px rgba(251, 191, 36, 0.1)',
        'cute-lg': '0 25px 80px rgba(124, 58, 237, 0.25), 0 10px 30px rgba(251, 191, 36, 0.15)',
        'cute-xl': '0 35px 100px rgba(124, 58, 237, 0.3), 0 12px 36px rgba(251, 191, 36, 0.2)',
      },
      borderRadius: {
        'cute': '20px',
        'cute-lg': '24px',
        'cute-xl': '32px',
      }
    }
  },
  plugins: []
};
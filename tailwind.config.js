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
        'primary-gradient': 'linear-gradient(135deg, #1a0b2e 0%, #2d1b4e 100%)',
        'secondary-gradient': 'linear-gradient(135deg, #FCD34D 0%, #FBD347 100%)',
        'accent-gradient': 'linear-gradient(135deg, #FF8C00 0%, #FFA500 100%)',
        'purple-gradient': 'linear-gradient(135deg, #7C3AED 0%, #8B5CF6 100%)',
      },
      boxShadow: {
        'cute': '0 4px 12px rgba(0, 0, 0, 0.3)',
        'cute-lg': '0 8px 24px rgba(0, 0, 0, 0.4)',
        'cute-xl': '0 12px 36px rgba(0, 0, 0, 0.5)',
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
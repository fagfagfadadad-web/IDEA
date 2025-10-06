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
          500: '#a855f7',
          600: '#9333ea',
          700: '#7e22ce',
          800: '#6b21a8',
          900: '#581c87',
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
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
      },
      backgroundImage: {
        'primary-gradient': 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)',
        'secondary-gradient': 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
        'accent-gradient': 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
        'pastel-gradient': 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 50%, #e9d5ff 100%)',
      },
      boxShadow: {
        'cute': '0 20px 60px rgba(139, 92, 246, 0.15), 0 8px 24px rgba(0, 0, 0, 0.05)',
        'cute-lg': '0 25px 80px rgba(139, 92, 246, 0.2), 0 10px 30px rgba(0, 0, 0, 0.08)',
        'cute-xl': '0 35px 100px rgba(139, 92, 246, 0.25), 0 12px 36px rgba(0, 0, 0, 0.1)',
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
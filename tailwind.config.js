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
          50: '#fff0f5',
          100: '#ffe4ec',
          200: '#ffc9da',
          300: '#ff8db4',
          400: '#ff6b9d',
          500: '#ff4a88',
          600: '#ef476f',
          700: '#d63864',
          800: '#b82d54',
          900: '#9a2647',
        },
        secondary: {
          50: '#fffbf0',
          100: '#fff6db',
          200: '#ffedb8',
          300: '#ffe494',
          400: '#ffd166',
          500: '#ffbe3d',
          600: '#ffa62b',
          700: '#f28c1f',
          800: '#d47318',
          900: '#b65f14',
        },
        accent: {
          50: '#f0fdf9',
          100: '#ccfbef',
          200: '#99f6e0',
          300: '#5ee9ce',
          400: '#26e7b0',
          500: '#06d6a0',
          600: '#00ac82',
          700: '#00896a',
          800: '#006d55',
          900: '#005a46',
        },
        success: '#06d6a0',
        warning: '#ffa62b',
        error: '#ef476f',
      },
      backgroundImage: {
        'primary-gradient': 'linear-gradient(135deg, #ff6b9d 0%, #ff8db4 100%)',
        'secondary-gradient': 'linear-gradient(135deg, #ffd166 0%, #ffa62b 100%)',
        'accent-gradient': 'linear-gradient(135deg, #26e7b0 0%, #06d6a0 100%)',
        'pastel-gradient': 'linear-gradient(135deg, #fff5f5 0%, #ffe9e9 50%, #ffd4e5 100%)',
      },
      boxShadow: {
        'cute': '0 20px 60px rgba(255, 107, 157, 0.15), 0 0 40px rgba(255, 182, 193, 0.1)',
        'cute-lg': '0 25px 80px rgba(255, 107, 157, 0.25), 0 0 50px rgba(255, 182, 193, 0.15)',
        'cute-xl': '0 35px 100px rgba(255, 107, 157, 0.35), 0 0 60px rgba(255, 182, 193, 0.2)',
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
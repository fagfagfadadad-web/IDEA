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
          50: '#f0f9f4',
          100: '#dcf2e3', 
          200: '#b9dcc5',
          300: '#8fa693',
          400: '#6b7f6f',
          500: '#5a6b5e',
          600: '#4a5a4e',
          700: '#3d4a41',
          800: '#333d36',
          900: '#2b332e',
        },
        secondary: {
          50: '#f0f9f4',
          100: '#dcf2e3',
          200: '#b9dcc5',
          300: '#8fa693',
          400: '#6b7f6f',
          500: '#5a6b5e',
          600: '#4a5a4e',
          700: '#3d4a41',
          800: '#333d36',
          900: '#2b332e',
        },
        accent: {
          50: '#fef7f7',
          100: '#fde7ec',
          200: '#fbd5dd',
          300: '#f7b2c1',
          400: '#f18ba0',
          500: '#e85d75',
          600: '#d63384',
          700: '#b02a5b',
          800: '#9c2650',
          900: '#8b2447',
        }
      },
      backgroundImage: {
        'primary-gradient': 'linear-gradient(135deg, #6b7f6f 0%, #5a6b5e 50%, #4a5a4e 100%)',
        'secondary-gradient': 'linear-gradient(135deg, #b9dcc5 0%, #8fa693 50%, #6b7f6f 100%)',
        'accent-gradient': 'linear-gradient(135deg, #fde7ec 0%, #f7b2c1 50%, #e85d75 100%)',
      },
      boxShadow: {
        'cute': '0 20px 60px rgba(107, 127, 111, 0.15)',
        'cute-lg': '0 25px 80px rgba(107, 127, 111, 0.25)',
        'cute-xl': '0 35px 100px rgba(107, 127, 111, 0.35)',
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
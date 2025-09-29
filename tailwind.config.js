/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Nunito"', 'sans-serif'],
        fredoka: ['"Fredoka"', 'cursive'],
        nunito: ['"Nunito"', 'sans-serif']
      },
      colors: {
        tamagochi: {
          50: '#fef7ff',
          100: '#fdeeff', 
          200: '#fcdcff',
          300: '#f9b9ff',
          400: '#f486ff',
          500: '#ff69b4', // Main pink
          600: '#ec4899',
          700: '#d946ef', // Main purple
          800: '#c026d3',
          900: '#a21caf',
        },
        cute: {
          50: '#fff0f5',
          100: '#ffe4ec',
          200: '#ffcdd9',
          300: '#ffa3b5',
          400: '#ff6b9d',
          500: '#ff3d71',
          600: '#f01d4e',
          700: '#d1123a',
          800: '#b01233',
          900: '#95142f',
        },
        pastel: {
          pink: '#ffb3d9',
          purple: '#d9b3ff',
          blue: '#b3d9ff',
          green: '#b3ffb3',
          yellow: '#ffffb3',
          orange: '#ffccb3',
        }
      },
      animation: {
        'bounce-cute': 'bounceCute 2s ease-in-out infinite',
        'float-cute': 'floatCute 3s ease-in-out infinite',
        'pulse-cute': 'pulseCute 2s ease-in-out infinite',
        'heart-float': 'heartFloat 4s ease-in-out infinite',
        'star-twinkle': 'starTwinkle 1.5s ease-in-out infinite alternate',
        'sparkle': 'sparkle 2s ease-in-out infinite',
        'float-decoration': 'floatDecoration 6s ease-in-out infinite',
      },
      backgroundImage: {
        'tamagochi-gradient': 'linear-gradient(135deg, #fef7ff 0%, #fdeeff 50%, #fcdcff 100%)',
        'cute-gradient': 'linear-gradient(135deg, #ff69b4 0%, #d946ef 50%, #60a5fa 100%)',
        'pastel-gradient': 'linear-gradient(135deg, #ffb3d9 0%, #d9b3ff 50%, #b3d9ff 100%)',
      },
      boxShadow: {
        'cute': '0 20px 60px rgba(255, 105, 180, 0.15)',
        'cute-lg': '0 25px 80px rgba(255, 105, 180, 0.25)',
        'cute-xl': '0 35px 100px rgba(255, 105, 180, 0.35)',
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
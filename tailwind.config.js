/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', 'sans-serif'],
        orbitron: ['"Orbitron"', 'monospace']
      },
      colors: {
        tamagochi: {
          50: '#fef7ff',
          100: '#fdeeff',
          200: '#fcdcff',
          300: '#f9b9ff',
          400: '#f486ff',
          500: '#ec4899',
          600: '#d946ef',
          700: '#c026d3',
          800: '#a21caf',
          900: '#86198f',
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
        }
      },
      animation: {
        'space-float': 'spaceFloat 6s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'mining-shimmer': 'miningShimmer 2s linear infinite',
      },
      backgroundImage: {
        'cute-gradient': 'linear-gradient(135deg, #ff6b9d 0%, #ec4899 50%, #d946ef 100%)',
        'tamagochi-gradient': 'linear-gradient(to right, #ff6b9d, #ec4899, #d946ef)',
      }
    }
  },
  plugins: []
};
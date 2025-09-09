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
        zen: {
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
        }
      },
      animation: {
        'space-float': 'spaceFloat 6s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'mining-shimmer': 'miningShimmer 2s linear infinite',
      },
      backgroundImage: {
        'space-gradient': 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
        'zen-gradient': 'linear-gradient(to right, #06b6d4, #8b5cf6, #ec4899)',
      }
    }
  },
  plugins: []
};
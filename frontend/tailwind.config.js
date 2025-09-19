/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#2563EB',
          secondary: '#7C3AED',
          accent: '#06B6D4',
        },
        level: {
          expert: '#7C3AED',
          intermediate: '#2563EB',
          runner: '#06B6D4',
          trainee: '#10B981',
        },
        shift: {
          excellent: '#059669',
          good: '#84CC16',
          fair: '#EAB308',
          poor: '#EA580C',
          critical: '#DC2626',
        }
      },
      fontFamily: {
        sans: ['Rubik', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    function({ addUtilities }) {
      addUtilities({
        '.dir-rtl': {
          direction: 'rtl',
        },
        '.dir-ltr': {
          direction: 'ltr',
        },
        '.text-start': {
          textAlign: 'start',
        },
        '.text-end': {
          textAlign: 'end',
        },
      });
    },
  ],
}
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Fredoka"', 'ui-rounded', 'system-ui', 'sans-serif'],
        body: ['"Nunito"', 'ui-rounded', 'system-ui', 'sans-serif'],
      },
      animation: {
        'bounce-in': 'bounce-in 500ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        'slide-up': 'slide-up 400ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        'slide-down': 'slide-down 400ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        'fade-in': 'fade-in 300ms ease-out',
        'jelly': 'jelly 400ms ease-out',
        'shake': 'shake 400ms ease-in-out',
        'score-pop': 'score-pop 600ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'wiggle': 'wiggle 500ms ease-in-out',
        'float': 'float 3s ease-in-out infinite',
        'heart-pulse': 'heart-pulse 1s ease-in-out infinite',
      },
      keyframes: {
        'bounce-in': {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.1)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-down': {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'jelly': {
          '0%': { transform: 'scale(1, 1)' },
          '25%': { transform: 'scale(0.9, 1.1)' },
          '50%': { transform: 'scale(1.1, 0.9)' },
          '75%': { transform: 'scale(0.95, 1.05)' },
          '100%': { transform: 'scale(1, 1)' },
        },
        'shake': {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-4px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(4px)' },
        },
        'score-pop': {
          '0%': { transform: 'scale(1)' },
          '30%': { transform: 'scale(1.4)' },
          '100%': { transform: 'scale(1)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 5px rgba(72, 187, 120, 0.5)' },
          '50%': { boxShadow: '0 0 20px rgba(72, 187, 120, 0.8), 0 0 30px rgba(72, 187, 120, 0.4)' },
        },
        'wiggle': {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'heart-pulse': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.15)' },
        },
      },
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        talpa: {
          primary: '#0F172A', // Slate 900 - Main Text/Dark
          secondary: '#64748B', // Slate 500 - Muted Text
          accent: '#2563EB', // Blue 600 - Action
          hover: '#1D4ED8', // Blue 700 - Hover state
          surface: '#FFFFFF', // White
          bg: '#F8FAFC', // Slate 50 - Background
          success: '#059669', // Emerald 600
          danger: '#E11D48', // Rose 600
          warning: '#D97706', // Amber 600
          border: '#E2E8F0', // Slate 200
        }
      }
    },
  },
  plugins: [
    require("tailwindcss-animate"),
  ],
}


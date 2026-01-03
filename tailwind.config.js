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
          bg: '#0A1929',      // Deep Navy Background
          card: '#112240',    // Card/Panel Background
          primary: '#E5E5E5', // Main Text (Light)
          secondary: '#94A3B8', // Muted Text
          gold: '#D4AF37',    // Gold Accent
          goldHover: '#B5952F', // Gold Hover
          accent: '#ffffff1a', // Subtle White Border/Overlay
          success: '#059669', // Emerald 600
          danger: '#E11D48', // Rose 600
          warning: '#D97706', // Amber 600
          border: '#334155', // Slate 700 (Darker border)
          red: '#C41E3A', // Primary Brand Red
          'red-light': '#D64356',
          'red-dark': '#A01729',
        }
      }
    },
  },
  plugins: [
    require("tailwindcss-animate"),
  ],
}

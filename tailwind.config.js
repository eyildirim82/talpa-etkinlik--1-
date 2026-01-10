export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        talpa: {
          bg: '#F9FAFB', // Light gray background
          card: '#FFFFFF',
          text: {
            main: '#111827', // Gray 900
            secondary: '#6B7280', // Gray 500
            light: '#9CA3AF',
          },
          border: '#E5E7EB', // Gray 200
          primary: '#EF4444', // Red 500 (Brand)
          secondary: '#1F2937', // Gray 800
          success: '#10B981', // Green 500
          warning: '#F59E0B',
          danger: '#EF4444',
          gold: '#D4AF37', // Keeping legacy gold just in case
        },
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
  ],
}

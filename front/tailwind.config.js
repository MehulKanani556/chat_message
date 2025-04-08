/** @type {import('tailwindcss').Config} */

module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3B82F6', // Blue-500
          light: '#60A5FA',   // Blue-400
          dark: '#2563EB',    // Blue-600
        },
        secondary: {
          DEFAULT: '#10B981', // Emerald-500
          light: '#34D399',   // Emerald-400
          dark: '#059669',    // Emerald-600
        },
      },
    },
  },
  darkMode: 'class',
  plugins: [],
}
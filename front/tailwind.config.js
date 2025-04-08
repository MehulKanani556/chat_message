/** @type {import('tailwindcss').Config} */

module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // primary: {
        //   DEFAULT: "#7269FF",
        //   light: "#FFFFFF",
        //   dark: "#251F4B",
        // },
        // secondary: {
        //   DEFAULT: "#10B981",
        //   light: "#34D399",
        //   dark: "#059669",
        // },
        primary: {
          DEFAULT: '#7269FF',
          light: '#FFFFFF',
          dark: '#141414',
        },
        secondary: {
          DEFAULT: '#10B981',
          light: '#34D399',
          dark: '#059669',
        },
      },
    },
  },
  darkMode: "class",
  plugins: [
    // Add plugin for scrollbar hiding
    function ({ addUtilities }) {
      addUtilities({
        ".scrollbar-hide": {
          /* IE and Edge */
          "-ms-overflow-style": "none",

          /* Firefox */
          "scrollbar-width": "none",

          /* Safari and Chrome */
          "&::-webkit-scrollbar": {
            display: "none",
          },
        },
      });
    },
  ],
};

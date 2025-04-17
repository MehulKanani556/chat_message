/** @type {import('tailwindcss').Config} */

module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    screens: {
      'xs': "320px",
      'sm': "425px",
      'md600': "601px",
      'md': "768px",
      'lg': "1024px",
      'xl': "1280px",
      "2xl": "1440px",
      "3xl": "1920px",
      "4xl": "2560px",
    },
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
          DEFAULT:
            "rgb(var(--primary-color-rgb, 114, 105, 255) / <alpha-value>)",
          light: "#FFFFFF",
          dark: "#141414",
        },
        secondary: {
          DEFAULT: "#10B981",
          light: "#34D399",
          dark: "#059669",
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

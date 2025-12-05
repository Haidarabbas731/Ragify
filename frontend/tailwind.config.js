/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Geist", "system-ui", "sans-serif"],
        serif: ["Source Serif 4", "Georgia", "serif"],
        mono: ["Geist Mono", "Courier New", "monospace"],
      },
    },
  },
  plugins: [],
};

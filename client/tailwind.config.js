/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#6B39E7",
        dark: "#1F1F1F",
        light: "#93A8AC",
        'dark-bg': "#18181b",
        'dark-hover': "#424242",
        'dark-card': "#232323",
        'dark-border': "#424242",
        darkbg: "#18181b",
        darkhover: "#424242",
        darkcard: "#232323",
        darkborder: "#424242",
      },
    },
  },
  plugins: [],
};
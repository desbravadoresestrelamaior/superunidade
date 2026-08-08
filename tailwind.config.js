/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        marinho: { 900: "#061529", 800: "#0B1F3F", 700: "#12294E", 600: "#1B3157", linha: "#26436F" },
        ouro: { DEFAULT: "#D4AF37", claro: "#F2DC9A" },
        prata: { DEFAULT: "#C9D2E0", fosca: "#7E8AA0" },
      },
      fontFamily: {
        titulo: ["Georgia", "'Times New Roman'", "serif"],
      },
    },
  },
  plugins: [],
};

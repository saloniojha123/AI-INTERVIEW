/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f1f6ff",
          100: "#dfe9ff",
          400: "#5b8def",
          500: "#3568e0",
          600: "#264fc0",
          900: "#111a3d",
        },
      },
    },
  },
  plugins: [],
};

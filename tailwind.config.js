/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#635BFF",
        background: "#F8FAFC",
        surface: "#FFFFFF",
        foreground: "#172033",
        muted: "#64748B",
        success: "#16A34A",
        danger: "#EF4444",
      },
    },
  },
  plugins: [],
};
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./pages/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0faff",
          100: "#e0f4ff",
          200: "#bde4ff",
          300: "#8bcdff",
          400: "#4faeff",
          500: "#1f8fff",
          600: "#0e6edb",
          700: "#0b56aa",
          800: "#0d4586",
          900: "#123c6d"
        }
      }
    }
  },
  plugins: []
};

export default config;

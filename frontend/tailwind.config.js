/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Inter'", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
      colors: {
        brand: {
          50:  "#ecfeff",
          100: "#cffafe",
          200: "#a5f3fc",
          300: "#67e8f9",
          400: "#22d3ee",
          500: "#06b6d4",
          600: "#0891b2",
          700: "#0e7490",
          800: "#155e75",
          900: "#164e63",
        },
      },
      borderRadius: {
        "4xl": "2rem",
      },
      boxShadow: {
        "card": "0 1px 3px rgba(0,0,0,.06), 0 4px 16px rgba(0,0,0,.06)",
        "card-hover": "0 4px 8px rgba(0,0,0,.08), 0 16px 40px rgba(0,0,0,.1)",
        "modal": "0 20px 60px rgba(0,0,0,.12)",
      },
      animation: {
        "fade-up":   "fadeUp 0.5s ease both",
        "fade-in":   "fadeIn 0.4s ease both",
        "slide-up":  "slideUp 0.35s ease both",
      },
      keyframes: {
        fadeUp:   { "0%": { opacity: 0, transform: "translateY(16px)" }, "100%": { opacity: 1, transform: "translateY(0)" } },
        fadeIn:   { "0%": { opacity: 0 }, "100%": { opacity: 1 } },
        slideUp:  { "0%": { opacity: 0, transform: "translateY(24px)" }, "100%": { opacity: 1, transform: "translateY(0)" } },
      },
    },
  },
  plugins: [],
}

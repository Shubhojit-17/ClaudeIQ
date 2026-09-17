/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Ultra-modern futuristic dark palette
        cyber: {
          darkest: "#05070a",
          dark: "#080a0f",
          card: "#0d111a",
          cardHover: "#121724",
          border: "rgba(255, 255, 255, 0.08)",
          borderGlow: "rgba(99, 102, 241, 0.25)",
        },
        // ClauseIQ brand palette (Electric Indigo & Cyber Violet)
        brand: {
          50:  "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",  // Primary
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
          950: "#14133b",
        },
        surface: {
          50:  "#f8fafc",
          100: "#f1f5f9",
          200: "#cbd5e1",
          300: "#94a3b8",
          400: "#64748b",
          700: "#1e2433",
          750: "#181e2b",
          800: "#131722",
          850: "#0f131c",
          900: "#0b0e14",
          950: "#07090e",
        },
      },
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["'JetBrains Mono'", "'Fira Code'", "monospace"],
      },
      boxShadow: {
        "glow-sm": "0 0 15px -3px rgba(99, 102, 241, 0.15)",
        "glow-md": "0 0 25px -4px rgba(99, 102, 241, 0.25)",
        "glow-cyan": "0 0 25px -4px rgba(6, 182, 212, 0.25)",
        "glow-emerald": "0 0 25px -4px rgba(16, 185, 129, 0.25)",
        "glow-rose": "0 0 25px -4px rgba(244, 63, 94, 0.25)",
        "card-inner": "inset 0 1px 0 0 rgba(255, 255, 255, 0.07)",
      },
      animation: {
        "fade-in": "fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-in": "slideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
        "pulse-subtle": "pulseSubtle 3s ease-in-out infinite",
        "pulse-radar": "pulseRadar 2.5s cubic-bezier(0, 0, 0.2, 1) infinite",
        "shimmer": "shimmer 2.5s infinite linear",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideIn: {
          "0%": { opacity: "0", transform: "translateX(-12px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        pulseSubtle: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.65" },
        },
        pulseRadar: {
          "0%": { transform: "scale(0.95)", opacity: "0.8" },
          "50%": { transform: "scale(1.4)", opacity: "0" },
          "100%": { transform: "scale(0.95)", opacity: "0" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};

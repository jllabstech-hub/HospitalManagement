import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          50: "#F0F7F8",
          100: "#D9EBEE",
          200: "#B3D6DD",
          300: "#7FB8C4",
          400: "#4A96A8",
          500: "#2A7A8C",
          600: "#1B5F6E",
          700: "#0F4A56",
          800: "#0B3A44",
          900: "#082E36",
          950: "#041C22",
        },
        accent: {
          50: "#F0F9F4",
          100: "#D8F0E3",
          200: "#B3E0C9",
          300: "#7DC8A4",
          400: "#4AAA7E",
          500: "#2D8A5E",
          600: "#216B49",
          700: "#1B553B",
          800: "#174431",
          900: "#133829",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          muted: "#F5F7F8",
          warm: "#F8F7F4",
          soft: "#EEF3F5",
        },
        ink: {
          DEFAULT: "#14212B",
          muted: "#5B6B76",
          soft: "#8A97A1",
          inverse: "#F8FAFB",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        display: ["var(--font-inter)", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
      fontSize: {
        "display-xl": ["3.5rem", { lineHeight: "1.08", letterSpacing: "-0.03em", fontWeight: "600" }],
        "display-lg": ["2.75rem", { lineHeight: "1.12", letterSpacing: "-0.025em", fontWeight: "600" }],
        "display-md": ["2.125rem", { lineHeight: "1.2", letterSpacing: "-0.02em", fontWeight: "600" }],
        "display-sm": ["1.625rem", { lineHeight: "1.25", letterSpacing: "-0.015em", fontWeight: "600" }],
      },
      maxWidth: {
        container: "72rem",
        content: "42rem",
        wide: "80rem",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(20, 33, 43, 0.04), 0 4px 16px rgba(20, 33, 43, 0.06)",
        card: "0 1px 3px rgba(20, 33, 43, 0.05), 0 8px 24px rgba(20, 33, 43, 0.06)",
        elevated: "0 8px 30px rgba(20, 33, 43, 0.1)",
        header: "0 1px 0 rgba(20, 33, 43, 0.06), 0 8px 20px rgba(20, 33, 43, 0.04)",
      },
      borderRadius: {
        card: "1rem",
        button: "0.625rem",
        pill: "9999px",
      },
      spacing: {
        section: "5.5rem",
        "section-sm": "3.5rem",
      },
      transitionDuration: {
        brand: "200ms",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.45s ease-out both",
        "fade-in": "fade-in 0.35s ease-out both",
      },
    },
  },
  plugins: [],
};
export default config;

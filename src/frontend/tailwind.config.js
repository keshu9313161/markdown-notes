import typography from "@tailwindcss/typography";
import containerQueries from "@tailwindcss/container-queries";
import animate from "tailwindcss-animate";
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["index.html", "src/**/*.{js,ts,jsx,tsx,html,css}"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },

    extend: {
      colors: {
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        sidebar: {
          DEFAULT: "var(--sidebar)",
          foreground: "var(--sidebar-foreground)",
          primary: "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)",
        },
        chart: {
          1: "var(--chart-1)",
          2: "var(--chart-2)",
          3: "var(--chart-3)",
          4: "var(--chart-4)",
          5: "var(--chart-5)",
        },
        landing: "var(--landing)",
        "landing-highlight": "var(--landing-highlight)",
      },
      borderRadius: {
        xl: "calc(var(--radius) + 4px)",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        serif: ["var(--font-serif)"],
        mono: ["var(--font-mono)"],
        display: ["var(--font-display)"],
      },
      boxShadow: {
        "2xs": "var(--shadow-2xs)",
        xs: "var(--shadow-xs)",
        sm: "var(--shadow-sm)",
        DEFAULT: "var(--shadow)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        xl: "var(--shadow-xl)",
        "2xl": "var(--shadow-2xl)",
      },
      borderColor: {
        DEFAULT: "var(--border)",
      },
      letterSpacing: {
        normal: "var(--tracking-normal)",
      },
      keyframes: {
        "page-fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "search-expand": {
          "0%": { opacity: "0", transform: "scaleX(0.3)" },
          "100%": { opacity: "1", transform: "scaleX(1)" },
        },
        "search-collapse": {
          "0%": { opacity: "1", transform: "scaleX(1)" },
          "100%": { opacity: "0", transform: "scaleX(0.3)" },
        },
        "filter-slide-down": {
          "0%": { height: "0", opacity: "0" },
          "100%": {
            height: "var(--radix-collapsible-content-height)",
            opacity: "1",
          },
        },
        "filter-slide-up": {
          "0%": {
            height: "var(--radix-collapsible-content-height)",
            opacity: "1",
          },
          "100%": { height: "0", opacity: "0" },
        },
      },
      animation: {
        "page-fade-in": "page-fade-in 0.7s cubic-bezier(0.4, 0, 0.2, 1) both",
        "search-expand": "search-expand 0.2s ease-out both",
        "search-collapse": "search-collapse 0.15s ease-in both",
        "filter-slide-down": "filter-slide-down 0.2s ease-out",
        "filter-slide-up": "filter-slide-up 0.2s ease-out",
      },
    },
  },
  plugins: [typography, containerQueries, animate],
};

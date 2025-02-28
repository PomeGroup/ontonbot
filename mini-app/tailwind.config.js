const konstaConfig = require("konsta/config");

/** @type {import('tailwindcss').Config} */
module.exports = konstaConfig({
  konsta: {
    colors: {
      // "primary" is the main app color, if not specified will be default to '#007aff'
      primary: "#007aff",
      // custom colors used for Konsta UI components theming
      "brand-red": "#ff0000",
      "brand-green": "#34C759",
      "brand-gray": "#888888",
      "brand-purple": "#6d28d9",
      "brand-fill-bg": "#747480",
      "brand-muted": "#8e8e93",
      "brand-divider": "#eeeef0",
    },
  },
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  theme: {
    fontFamily: {
      ios: "-apple-system, Roboto ,SF Pro Text, SF UI Text, system-ui, Helvetica Neue, Helvetica, Arial, sans-serif",
    },
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    fontWeight: {
      thin: "100",
      extralight: "200",
      light: "300",
      normal: "400",
      medium: "510",
      semibold: "590",
      bold: "700",
      extrabold: "800",
      black: "900",
    },
    listStyleType: {
      disc: "disc",
      circle: "circle",
    },
    extend: {
      screens: {
        xxs: "320px",
        xs: "375px",
      },
      borderRadius: {
        "2lg": "10px",
      },
      spacing: {
        11.5: "46px",
        12.5: "50px",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--shadcn-tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--shadcn-tw-gradient-stops))",
      },
      colors: {
        "cn-border": "hsl(var(--shadcn-border))",
        "cn-input": "hsl(var(--shadcn-input))",
        "cn-ring": "hsl(var(--shadcn-ring))",
        "cn-background": "hsl(var(--shadcn-background))",
        "cn-foreground": "hsl(var(--shadcn-foreground))",
        "main-button-color": "#007AFF",
        "disabled-font": "#B9B9BA",
        confirm: "#34C759",
        "wallet-tertiary_fill_background": "#747480",

        "cn-primary": {
          DEFAULT: "hsl(var(--shadcn-primary))",
          foreground: "hsl(var(--shadcn-primary-foreground))",
        },

        "cn-secondary": {
          DEFAULT: "hsla(var(--shadcn-secondary))",
          foreground: "hsl(var(--shadcn-secondary-foreground))",
        },
        "cn-destructive": {
          DEFAULT: "hsla(var(--shadcn-destructive))",
          foreground: "hsl(var(--shadcn-destructive-foreground))",
        },
        "cn-muted": {
          DEFAULT: "hsla(var(--shadcn-muted))",
          foreground: "hsl(var(--shadcn-muted-foreground))",
        },
        "cn-accent": {
          DEFAULT: "hsl(var(--shadcn-accent))",
          foreground: "hsl(var(--shadcn-accent-foreground))",
        },
        "cn-popover": {
          DEFAULT: "hsl(var(--shadcn-popover))",
          foreground: "hsl(var(--shadcn-popover-foreground))",
        },
        "cn-card": {
          DEFAULT: "hsl(var(--shadcn-card))",
          foreground: "hsl(var(--shadcn-card-foreground))",
        },
        "cn-separator": "var(--shadcn-color-separator)",
        "cn-tertiary": "var(--shadcn-color-bg-tertiary)",
        "cn-separatorwo": "var( --shadcn-color-separator-without-opacity)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--shadcn-radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--shadcn-radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      scale: {
        67: "0.67",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
});

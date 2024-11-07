import Typography from "@tailwindcss/typography"
import type { Config } from "tailwindcss"
import tailwindcssAnimate from "tailwindcss-animate"

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
    './**/*.ts'
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-family)"],
      },
      colors: {
        "telegram-bg-color": "var(--telegram-bg-color)",
        "telegram-text-color": "var(--telegram-text-color)",
        "telegram-hint-color": "var(--telegram-hint-color)",
        "telegram-link-color": "var(--telegram-link-color)",
        "telegram-button-text-color": "var(--telegram-button-text-color)",
        "telegram-button-color": "var(--telegram-button-color)",
        "telegram-secondary-bg-color": "var(--telegram-secondary-bg-color)",
        "telegram-6-10-header-bg-color": "var(--telegram-6-10-header-bg-color)",
        "telegram-6-10-section-bg-color":
          "var(--telegram-6-10-section-bg-color)",
        "telegram-6-10-accent-text-color":
          "var(--telegram-6-10-accent-text-color)",
        "telegram-6-10-subtitle-text-color":
          "var(--telegram-6-10-subtitle-text-color)",
        "telegram-6-10-section-header-text-color":
          "var(--telegram-6-10-section-header-text-color)",
        "telegram-6-10-destructive-text-color":
          "var(--telegram-6-10-destructive-text-color)",
        "wallet-separator-color": "var(--wallet-separator-color)",
        "wallet-second-button-color": "var(--wallet-second-button-color)",
        "wallet-button-confirm-color": "var(--wallet-button-confirm-color)",
        "wallet-text-confirm-color": "var(--wallet-text-confirm-color)",
        "wallet-button-main-disabled-color":
          "var(--wallet-button-main-disabled-color)",
        "wallet-text-main-disabled-color":
          "var(--wallet-text-main-disabled-color)",
        "wallet-D-text-destructive-color":
          "var(--wallet-D-text-destructive-color)",
        "wallet-button-destructive-color":
          "var(--wallet-button-destructive-color)",
        "wallet-highlight-default": "var(--wallet-highlight-default)",
        "wallet-quick-menu-background": "var(--wallet-quick-menu-background)",
        "wallet-quick-menu-foreground": "var(--wallet-quick-menu-foreground)",
        "wallet-toast-background": "var(--wallet-toast-background)",
        "wallet-text-overlay": "var(--wallet-text-overlay)",
        "wallet-toast-link": "var(--wallet-toast-link)",
        "wallet-tertiary-fill-background":
          "var(--wallet-tertiary-fill-background)",
        "wallet-quaternary-fill-background":
          "var(--wallet-quaternary-fill-background)",
        "wallet-separator-non-opaque-color":
          "var(--wallet-separator-non-opaque-color)",
        "wallet-accent-orange": "var(--wallet-accent-orange)",
        "wallet-segmented-control-active-background":
          "var(--wallet-segmented-control-active-background)",
      },
      borderRadius: {
        lg: "var(--border-radius)",
        md: "calc(var(--border-radius) - 2px)",
        sm: "calc(var(--border-radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      fontWeight: {
        semiBold: "590",
      },
      typography: () => ({
        // IOS
        "title-1": {},
        "title-2": {},
        "title-3": {},
        headline: {},
        body: {},
        callout: {},
        "subheadline-1": {},
        "subheadline-2": {},
        footnote: {},
        "caption-1": {},
        "caption-2": {},
      }),
    },
  },
  plugins: [tailwindcssAnimate, Typography({ className: "type" })],
} satisfies Config;

export default config;

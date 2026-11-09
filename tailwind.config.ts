import type { Config } from "tailwindcss";

/**
 * KRISHNA GARMENTS palette — locked by brand brief section 1.
 * Do not introduce pure white surfaces or off-brief accent colours.
 */
const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        charcoal: "#121110", // main background
        deep: "#1D1916", // cards & sections
        espresso: "#302016", // secondary surfaces
        copper: "#B87333", // main accent
        champagne: "#D49A60", // highlights
        ivory: "#E9D9C5", // text & subtle surfaces
        // Derived tones kept strictly inside the approved hue family.
        copperDark: "#8A5526",
        copperSoft: "#9C6B3E",
        ink: "#0C0B0A",
        line: "#3A2A1D",
        ok: "#5FBF7F",
        warn: "#D9A441",
        danger: "#C4614C",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(184,115,51,.35), 0 18px 45px -18px rgba(184,115,51,.45)",
        card: "0 24px 60px -30px rgba(0,0,0,.85)",
        inset: "inset 0 1px 0 rgba(233,217,197,.06)",
      },
      backgroundImage: {
        sheen:
          "linear-gradient(115deg, rgba(212,154,96,0) 0%, rgba(212,154,96,.14) 45%, rgba(212,154,96,0) 70%)",
        vignette:
          "radial-gradient(120% 90% at 50% 0%, rgba(48,32,22,.55) 0%, rgba(18,17,16,0) 60%)",
      },
      keyframes: {
        shimmer: { "0%": { transform: "translateX(-120%)" }, "100%": { transform: "translateX(220%)" } },
        fadeUp: { "0%": { opacity: "0", transform: "translateY(18px)" }, "100%": { opacity: "1", transform: "none" } },
      },
      animation: {
        shimmer: "shimmer 2.6s ease-in-out infinite",
        fadeUp: "fadeUp .7s cubic-bezier(.22,1,.36,1) both",
      },
    },
  },
  plugins: [],
};

export default config;

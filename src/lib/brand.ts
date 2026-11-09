/**
 * Brand palette — single source of truth, mirrors tailwind.config.ts.
 * Kept in TS because canvas drawing and inline gradients cannot use Tailwind classes.
 */
export const palette = {
  charcoal: "#121110",
  deep: "#1D1916",
  espresso: "#302016",
  copper: "#B87333",
  champagne: "#D49A60",
  ivory: "#E9D9C5",
  copperDark: "#8A5526",
  line: "#3A2A1D",
  ink: "#0C0B0A",
} as const;

export const brand = {
  name: "KRISHNA GARMENTS",
  short: "Krishna Garments",
  emblem: "K",
  tagline: "From Fabric to Fashion",
  heroEyebrow: "THE MAKING OF QUALITY",
  heroTitle: ["From Fabric", "to Fashion"],
  heroLead:
    "At Krishna Garments, every garment is crafted with care, precision, and passion — from selecting the finest fabric to the final stitch.",
} as const;

/** Copper gradient used for buttons, chart strokes and dividers. */
export const copperGradient = `linear-gradient(100deg, ${palette.copper} 0%, ${palette.champagne} 55%, ${palette.copper} 100%)`;

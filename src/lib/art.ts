/**
 * On-brand SVG artwork generator.
 *
 * The brief's reference imagery is premium fashion photography that has not been
 * supplied yet, so every image slot renders a generated copper/ivory garment
 * silhouette instead. Each helper returns a data-URI-safe SVG string.
 *
 * To use real photography later, set `image` / `images` on the product or
 * category record in the database — components already prefer a stored path and
 * fall back to these placeholders. No code changes required.
 */

import { palette } from "@/lib/brand";

export type ArtKind =
  | "jacket"
  | "dress"
  | "top"
  | "jeans"
  | "kurti"
  | "shirt"
  | "trouser"
  | "skirt"
  | "ethnic"
  | "party"
  | "accessory"
  | "coord"
  | "fabric"
  | "tailoring"
  | "collection";

const GOLD = palette.copper;
const LIGHT = palette.champagne;
const IVORY = palette.ivory;

/** Simple line-art silhouettes, drawn on a 3:4 portrait canvas. */
const SILHOUETTES: Record<ArtKind, string> = {
  jacket: `<path d="M150 96c-24 0-42 8-52 22l-26 34c-6 8-4 14 4 16l20 4v96h108V172l20-4c8-2 10-8 4-16l-26-34c-10-14-28-22-52-22z"/>
    <path d="M150 96l-16 44 16 22 16-22-16-44z" opacity=".5"/>
    <path d="M150 162v106" stroke-width="2" fill="none"/>
    <circle cx="150" cy="200" r="4"/><circle cx="150" cy="236" r="4"/><circle cx="150" cy="272" r="4"/>`,
  coord: `<path d="M112 92c-18 0-32 6-40 18L50 128c-5 7-3 12 3 13l15 3v58h44z"/>
    <path d="M188 92c18 0 32 6 40 18l22 18c5 7 3 12-3 13l-15 3v58h-44z"/>
    <path d="M96 232h108l10 96H86z" opacity=".85"/>`,
  top: `<path d="M150 92c-26 0-44 10-52 26l-14 30c-3 7 0 11 6 12l12 2v72h96v-72l12-2c6-1 9-5 6-12l-14-30c-8-16-26-26-52-26z"/>
    <path d="M120 96c8 14 20 20 30 20s22-6 30-20" fill="none" stroke-width="3"/>`,
  dress: `<path d="M150 88c-22 0-38 8-44 22l-8 26 12 4-20 118c-2 12 6 16 16 16h88c10 0 18-4 16-16l-20-118 12-4-8-26c-6-14-22-22-44-22z"/>
    <path d="M118 108c12 12 22 16 32 16s20-4 32-16" fill="none" stroke-width="3"/>`,
  jeans: `<path d="M104 96h92l10 40-6 148h-36l-8-116-8 116h-36l-6-148z"/>
    <path d="M104 118h92" fill="none" stroke-width="3"/><path d="M150 130v154" fill="none" stroke-width="2"/>`,
  kurti: `<path d="M150 90c-24 0-42 8-50 22l-22 30c-4 6-2 10 4 12l14 2v46l-10 92h124l-10-92v-46l14-2c6-2 8-6 4-12l-22-30c-8-14-26-22-50-22z"/>
    <path d="M150 96v112" fill="none" stroke-width="2"/>
    <path d="M126 120q24 22 48 0M126 152q24 22 48 0" fill="none" stroke-width="2" opacity=".7"/>`,
  shirt: `<path d="M150 92c-24 0-42 8-50 22l-24 28c-4 6-2 10 4 12l14 2v104h112V156l14-2c6-2 8-6 4-12l-24-28c-8-14-26-22-50-22z"/>
    <path d="M150 92l-18 24 18 20 18-20z" opacity=".55"/><path d="M150 136v112" fill="none" stroke-width="2"/>`,
  trouser: `<path d="M108 96h84l8 42-8 146h-30l-12-118-12 118h-30l-8-146z"/>
    <path d="M108 112h84" fill="none" stroke-width="3"/>`,
  skirt: `<path d="M112 110h76l8 30 26 128H78l26-128z"/>
    <path d="M112 110h76" fill="none" stroke-width="3"/><path d="M150 118v148" fill="none" stroke-width="2"/>`,
  ethnic: `<path d="M150 84c-26 0-44 10-52 26l-16 34c-3 7 0 11 6 12l10 2v52l-24 106h152l-24-106v-52l10-2c6-1 9-5 6-12l-16-34c-8-16-26-26-52-26z"/>
    <path d="M150 84c-14 18-6 34 0 44 6-10 14-26 0-44z" opacity=".6"/>
    <path d="M104 210q46 26 92 0" fill="none" stroke-width="3" opacity=".8"/>`,
  party: `<path d="M150 92c-20 0-36 8-42 22l-10 26 8 4-16 122c-2 10 5 14 14 14h92c9 0 16-4 14-14l-16-122 8-4-10-26c-6-14-22-22-42-22z"/>
    <path d="M112 150l76 0M104 190l92 0M96 236l108 0" fill="none" stroke-width="2" opacity=".55"/>`,
  accessory: `<circle cx="112" cy="150" r="30" fill="none" stroke-width="6"/>
    <path d="M112 180v46" fill="none" stroke-width="5"/><path d="M112 226l-16 34h32z"/>
    <circle cx="188" cy="150" r="30" fill="none" stroke-width="6"/><path d="M188 180v46" fill="none" stroke-width="5"/><path d="M188 226l-16 34h32z"/>`,
  fabric: `<path d="M40 200q60-70 110-40t160-30v190q-90 34-160 6t-110-26z" opacity=".9"/>
    <path d="M40 150q60-70 110-40t160-30" fill="none" stroke-width="4"/>
    <path d="M40 250q60-70 110-40t160-30" fill="none" stroke-width="3" opacity=".7"/>
    <path d="M40 330q60-70 110-40t160-30" fill="none" stroke-width="3" opacity=".5"/>`,
  tailoring: `<path d="M150 78a22 22 0 0 1 22 22c0 14-10 20-10 30l34 22c10 6 14 18 14 34v164H90V186c0-16 4-28 14-34l34-22c0-10-10-16-10-30a22 22 0 0 1 22-22z"/>
    <path d="M118 200l64 96M182 200l-64 96" fill="none" stroke-width="3" opacity=".75"/>`,
  collection: `<path d="M60 300l60-160 50 90 40-70 80 140z" opacity=".55"/>
    <circle cx="150" cy="120" r="46" opacity=".8"/>`,
};

function frame(inner: string, w: number, h: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
<defs>
<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="${palette.espresso}"/>
  <stop offset=".55" stop-color="${palette.deep}"/>
  <stop offset="1" stop-color="${palette.charcoal}"/>
</linearGradient>
<radialGradient id="spot" cx=".5" cy=".32" r=".62">
  <stop offset="0" stop-color="${GOLD}" stop-opacity=".30"/>
  <stop offset="1" stop-color="${GOLD}" stop-opacity="0"/>
</radialGradient>
<linearGradient id="fig" x1="0" y1="0" x2=".4" y2="1">
  <stop offset="0" stop-color="${LIGHT}"/>
  <stop offset=".6" stop-color="${GOLD}"/>
  <stop offset="1" stop-color="${palette.copperDark}"/>
</linearGradient>
</defs>
<rect width="${w}" height="${h}" fill="url(#bg)"/>
<rect width="${w}" height="${h}" fill="url(#spot)"/>
<g transform="translate(${(w - 300) / 2},${(h - 400) / 2}) scale(${Math.min(w / 300, h / 400)})"
   fill="url(#fig)" stroke="${IVORY}" stroke-opacity=".22" stroke-width="2">${inner}</g>
<rect x="8" y="8" width="${w - 16}" height="${h - 16}" fill="none" stroke="${GOLD}" stroke-opacity=".28"/>
</svg>`;
}

/** Portrait card art (products, categories). */
export function garmentArt(kind: ArtKind, opts: { width?: number; height?: number } = {}): string {
  const w = opts.width ?? 600;
  const h = opts.height ?? Math.round((w * 4) / 3);
  return svgUrl(frame(SILHOUETTES[kind] ?? SILHOUETTES.dress, w, h));
}

/** Wide editorial art (banners, seasonal cards). */
export function bannerArt(kind: ArtKind, opts: { width?: number; ratio?: number } = {}): string {
  const w = opts.width ?? 1200;
  const h = Math.round(w / (opts.ratio ?? 2.2));
  return svgUrl(frame(SILHOUETTES[kind] ?? SILHOUETTES.collection, w, h));
}

function svgUrl(svg: string): string {
  // encodeURIComponent keeps '#' in hex colours safe inside a data URI.
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.replace(/\n\s*/g, ""))}`;
}

/** Resolve whichever is available: real stored asset, else generated artwork. */
export function resolveImage(stored: string | null | undefined, kind: ArtKind, wide = false): string {
  if (stored && stored.trim()) return stored;
  return wide ? bannerArt(kind) : garmentArt(kind);
}

# KRISHNA GARMENTS — Implementation Plan (V2)

## 0. Asset analysis (done)

**Source video:** `Fabric_transforms_into_tailored_._dbb86bca_1080p.mp4`
- H.264 High, yuv420p, **1920x1080**, CFR **24/1 fps**, **239 frames**, **9.963 s**, 6.68 MB, has AAC audio track (unused).

**Verified shot map** (from contact sheets at every 8th and 24th frame):

| # | Frames | Time | Content (matches brief section 3) |
|---|--------|------|----------------------------------|
| 1 | 0–47   | 0.0–2.0s | Raw fabric roll on stand, unrolling across dark stage with gold particles |
| 2 | 48–95  | 2.0–4.0s | Industrial sewing machine stitching close-up, sparks |
| 3 | 96–119 | 4.0–5.0s | Fabric dissolves / transforms, jacket pieces assemble from cloth strips |
| 4 | 120–191 | 5.0–8.0s | Finished women's cream blazer floating in smoke, begins 360 rotation |
| 5 | 192–215 | 8.0–9.0s | Continues 360-degree reveal (side → back → front) |
| 6 | 216–238 | 9.0–9.96s | "KRISHNA GARMENTS" brand wordmark + tagline overlay reveal |

Frame positions for scroll mapping are taken directly from this real sequence, not invented.

## 1. Stack

Next.js 15 App Router · TypeScript · Tailwind CSS · GSAP + ScrollTrigger · Canvas API · FFmpeg (build-time frame extraction) · PostgreSQL + Prisma · Lucide icons.

Auth: Argon2id hashing (`@node-rs/argon2`), DB-backed opaque HTTP-only session cookies, rate limiting, server-side route guards.

## 2. Colour system (fixed, do not drift)

```
charcoal     #121110   page background        (70% target w/ deep charcoal)
deep         #1D1916   cards / sections
espresso     #302016   secondary surfaces
copper       #B87333   primary accent         (10%)
champagne    #D49A60   highlight
ivory        #E9D9C5   body text              (5%)
```
No pure white backgrounds anywhere.

## 3. Folder structure

```
krishna-garments/
  scripts/extract-frames.mjs      FFmpeg -> AVIF/WebP + manifest.json
  public/hero-frames/{hi,lo}/     extracted frames + manifest
  prisma/schema.prisma            Product, Category, Collection, Order, Customer,
                                  Payment, StockItem, ProductionBatch, Supplier,
                                  Enquiry, User, Session, Setting
  src/
    app/
      (site)/                     home, clothing/[category], product/[slug],
                                  collections, about, wholesale, cart, search
      owner/                      login + protected dashboard (9 sections)
      api/                        storefront + owner APIs, all guarded
    components/
      hero/ScrollVideoHero.tsx    canvas + ScrollTrigger frame player
      carousel/InfiniteMarquee.tsx direction-aware infinite loop
      ui/                         shared premium primitives
    lib/                          db, auth, session, rate-limit, palette, sample-data
```

## 4. Cinematic hero — technical approach

1. `scripts/extract-frames.mjs` runs FFmpeg once, emits two resolutions:
   - `hi/` 1280px wide (desktop/tablet landscape)
   - `lo/` 640px wide (mobile)
   Format: AVIF where supported, WebP fallback. ~239 frames each set.
2. `manifest.json`: `{ fps, count, stages: [{ id, label, from, to }], files: [...] }`.
   Stages use the verified shot map above so chapter markers land on real cuts.
3. `<canvas>` draws the current frame. A GSAP `ScrollTrigger` pins the section over
   `height: N * viewport` and maps `self.progress` -> frame index.
4. Reverse scroll reverses the frame pointer automatically (progress is bidirectional).
5. Loading: prefetch neighbours of the current frame, decode-ahead via
   `HTMLImageElement.decode()`, LRU cache of ~12 decoded bitmaps to cap memory.
   First paint uses frame 0 as an instant poster.
6. `prefers-reduced-motion`: skip pinning, show static brand-reveal frame + text.
7. Mobile: touch scrolling drives the same ScrollTrigger; `lo/` frames are swapped in by
   viewport width and DPR.

## 5. Carousels (sections 5 & 6)

Single `InfiniteMarquee` component, `direction="left-to-right" | "right-to-left"`.
- Duplicated track, CSS `transform: translateX()` animated by rAF (not keyframes) so
  pause-on-hover and manual arrows can adjust velocity smoothly with no jump at wrap.
- Pointer/touch drag supported; drag offsets blend into the auto-scroll position.
- New Arrivals = left→right, Seasonal = right→left, independent speeds, never synced.

## 6. Owner panel (/owner)

Reference screenshot reproduced: K emblem sidebar + 9 nav items, greeting bar, 4 KPI
cards (Total Sales / Pending Payments / Stock / Production), Sales Trend line chart,
Order Status donut, Low Stock / Pending Payments / Production Progress panels, quick
action row. All numbers come from the database, not hardcoded.
Functional CRUD for Orders, Inventory, Production, Payments, Customers, Suppliers,
Reports, Settings.

## 7. Data policy

Sample data lives in `prisma/seed-sample.ts` behind a `SAMPLE_DATA=true` marker column,
separate from real records, clearly labelled in the UI and removable with one command.

## 8. Open item

`DATABASE_URL` pending from owner. Everything except `prisma migrate` is built and
verified first; migration + seed run the moment the URL arrives.

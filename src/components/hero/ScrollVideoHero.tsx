"use client";

/**
 * ScrollVideoHero — scroll-driven 60fps video frame engine.
 *
 * Slices the garment manufacturing footage across all 239 frames:
 *   1. Preloads all 239 WebP frames for instantaneous, zero-latency canvas painting.
 *   2. Smooth lerp animation loop that walks through intermediate frames so scrolling
 *      feels like an actual fluid video playing forward or backward.
 *   3. In the Hero section, frames are BRIGHT and vibrant.
 *   4. Outside the Hero section, a dark overlay (0.82) smoothly fades in so all products,
 *      categories, and content above it are crisp and high-contrast.
 *   5. Gentle idle animation in the hero when at the top so the video is immediately alive.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { HeroManifest } from "./types";

type Props = {
  manifest: HeroManifest;
  children?: React.ReactNode;
  scrollMultiplier?: number;
};

export default function ScrollVideoHero({ manifest, children }: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [progress, setProgress] = useState(0);
  const [frameIndex, setFrameIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [darkOverlayOpacity, setDarkOverlayOpacity] = useState(0);
  const [isAtHero, setIsAtHero] = useState(true);

  const count = manifest.output.count;

  // ---- Rendition selection -------------------------------------------------
  const [setId, setSetId] = useState<"hi" | "lo">("hi");
  useEffect(() => {
    const pick = () => {
      const narrow = window.innerWidth < 900 || window.devicePixelRatio > 2.5;
      setSetId(narrow ? "lo" : "hi");
    };
    pick();
    window.addEventListener("resize", debounce(pick, 250));
    return () => window.removeEventListener("resize", debounce(pick, 250));
  }, []);

  const basePath = useMemo(
    () => manifest.output.sets.find((s) => s.id === setId)?.path ?? manifest.output.sets[0].path,
    [manifest.output.sets, setId],
  );

  // ---- High-performance frame preloader ------------------------------------
  // Holds all 239 preloaded HTMLImageElements in memory (~8MB total)
  const imagesRef = useRef<(HTMLImageElement | null)[]>([]);
  const currentFrameRef = useRef(0);
  const targetFrameRef = useRef(0);
  const lastDrawnRef = useRef(-1);
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Canvas drawing function
  const drawFrame = useCallback((img: HTMLImageElement) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(rect.width * dpr));
    const h = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    ctx.fillStyle = "#121110";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
  }, []);

  const drawIndex = useCallback(
    (idx: number) => {
      const clamped = clamp(idx, 0, count - 1);
      const img = imagesRef.current[clamped];
      if (img && img.complete && img.naturalWidth > 0) {
        drawFrame(img);
        setLoaded(true);
        setFrameIndex(clamped);
      }
    },
    [count, drawFrame],
  );

  // Preload all frames on mount
  useEffect(() => {
    const files = manifest.output.files;
    imagesRef.current = new Array(count).fill(null);

    // 1. Prime frame 0 immediately
    const firstImg = new Image();
    firstImg.src = `${basePath}/${files[0]}`;
    firstImg.onload = () => {
      imagesRef.current[0] = firstImg;
      drawIndex(0);
    };

    // 2. Preload the rest of the 239 frames
    for (let i = 0; i < count; i++) {
      const img = new Image();
      img.decoding = "async";
      img.src = `${basePath}/${files[i]}`;
      img.onload = () => {
        imagesRef.current[i] = img;
        if (i === 0 && !loaded) {
          drawIndex(0);
        }
      };
    }
  }, [basePath, count, manifest.output.files, drawIndex, loaded]);

  // ---- 60fps Smooth Lerp Animation Loop ------------------------------------
  useEffect(() => {
    let rafId = 0;

    const animate = () => {
      // Smooth lerp toward target frame
      const diff = targetFrameRef.current - currentFrameRef.current;
      if (Math.abs(diff) > 0.05) {
        currentFrameRef.current += diff * 0.24;
        const renderIdx = clamp(Math.round(currentFrameRef.current), 0, count - 1);
        if (renderIdx !== lastDrawnRef.current) {
          drawIndex(renderIdx);
          lastDrawnRef.current = renderIdx;
        }
      }

      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [count, drawIndex]);

  // ---- Scroll Listener -----------------------------------------------------
  useEffect(() => {
    const onScroll = () => {
      isScrollingRef.current = true;
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => {
        isScrollingRef.current = false;
      }, 150);

      const scrollY = window.scrollY;
      const vh = window.innerHeight;
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - vh);

      // In the hero section, keep strictly the first frame (frame 0) - not the video.
      // Outside the hero section, scrub through the video frames across the rest of the site.
      const heroThreshold = vh * 0.75;

      if (scrollY <= heroThreshold) {
        // Locked to first frame in hero
        targetFrameRef.current = 0;
        setProgress(0);
        setDarkOverlayOpacity(0);
        setIsAtHero(true);
      } else {
        // Outside hero section: scrub through frames across the rest of the website
        const scrollPastHero = scrollY - heroThreshold;
        const remainingScroll = Math.max(1, maxScroll - heroThreshold);
        const p = clamp(scrollPastHero / remainingScroll, 0, 1);
        setProgress(p);

        const targetIdx = clamp(Math.round(p * (count - 1)), 0, count - 1);
        targetFrameRef.current = targetIdx;

        // Smoothly fade in dark overlay (0.82) so material/cards above are clear
        const fadeRange = vh * 0.45;
        const ratio = Math.min(1, (scrollY - heroThreshold) / fadeRange);
        setDarkOverlayOpacity(ratio * 0.82);
        setIsAtHero(false);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, [count]);

  // Resize handler
  useEffect(() => {
    const onResize = debounce(() => {
      if (lastDrawnRef.current >= 0) {
        drawIndex(lastDrawnRef.current);
      }
    }, 150);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [drawIndex]);

  const activeStage =
    manifest.stages.find((s) => frameIndex >= s.from && frameIndex <= s.to) ??
    manifest.stages[manifest.stages.length - 1];

  return (
    <>
      {/* Fixed Background Frame Player Canvas */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <canvas
          ref={canvasRef}
          className="h-full w-full object-cover will-change-transform"
          style={{ opacity: loaded ? 1 : 0, transition: "opacity .5s ease" }}
        />

        {/* Dynamic dark overlay: 0 in hero (bright), 0.82 outside hero (dark for clear material) */}
        <div
          className="absolute inset-0 bg-[#121110] transition-opacity duration-300 ease-out"
          style={{ opacity: darkOverlayOpacity }}
        />

        {/* Hero-specific subtle legibility gradients */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-charcoal/80 via-charcoal/40 to-transparent transition-opacity duration-500 md:via-charcoal/25"
          style={{ opacity: isAtHero ? 1 : 0 }}
        />
        <div
          className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-charcoal to-transparent transition-opacity duration-500"
          style={{ opacity: isAtHero ? 1 : 0 }}
        />
      </div>

      <section
        ref={sectionRef}
        id="making"
        className="relative z-10 flex min-h-[100svh] w-full flex-col justify-between overflow-hidden"
        aria-label="The making of quality — fabric becoming fashion"
      >
        {!loaded && (
          <div className="absolute inset-0 z-20 grid place-items-center">
            <div className="flex flex-col items-center gap-3">
              <span className="font-display text-2xl tracking-[0.3em] text-champagne/70">KG</span>
              <span className="h-px w-24 animate-pulse bg-copper/60" />
            </div>
          </div>
        )}

        <div className="relative z-10 flex flex-1 flex-col justify-between">
          {children}

          {/* Scroll cue in hero */}
          <div className="pointer-events-none px-6 pb-8 md:px-12">
            <div className="mx-auto flex max-w-4xl flex-col items-center gap-2">
              <p className="text-center text-[11px] uppercase tracking-[0.32em] text-champagne/80">
                Scroll to craft &amp; explore
              </p>
              <span className="h-6 w-px bg-gradient-to-b from-champagne via-copper/60 to-transparent animate-pulse" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

// ------------------------------------------------------------------- helpers --

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

function debounce(fn: () => void, ms: number) {
  let t: ReturnType<typeof setTimeout>;
  return () => {
    clearTimeout(t);
    t = setTimeout(fn, ms);
  };
}



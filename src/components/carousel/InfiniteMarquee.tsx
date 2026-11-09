"use client";

/**
 * InfiniteMarquee — High-performance dual-direction infinite carousel.
 *
 * Runs continuously via requestAnimationFrame with sub-pixel precision.
 * - direction="left-to-right": items glide smoothly toward the right (→)
 * - direction="right-to-left": items glide smoothly toward the left (←)
 * - Seamless wrapping using duplicated unit track (no seams, no jumps, 0 gaps)
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type MarqueeDirection = "left-to-right" | "right-to-left";

type Props = {
  direction: MarqueeDirection;
  /** Pixels per second at full speed. */
  speed?: number;
  children: React.ReactNode;
  className?: string;
  ariaLabel: string;
};

export default function InfiniteMarquee({
  direction,
  speed = 70,
  children,
  className = "",
  ariaLabel,
}: Props) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const unitRef = useRef<HTMLDivElement>(null);

  // Animation state in a mutable ref for zero React re-render overhead during animation
  const state = useRef({
    pos: 0,
    unitWidth: 0,
    target: speed,
    current: speed,
    dragging: false,
    lastPointer: 0,
    hovered: false,
  }).current;

  const [draggingState, setDraggingState] = useState(false);

  useEffect(() => {
    state.target = speed;
  }, [speed, state]);

  // Keep unitWidth updated via ref directly so frame 0 can start immediately
  const updateUnitWidth = useCallback(() => {
    if (unitRef.current) {
      const w = unitRef.current.scrollWidth || unitRef.current.offsetWidth;
      if (w > 0) {
        state.unitWidth = w;
      }
    }
  }, [state]);

  useEffect(() => {
    updateUnitWidth();

    const ro = new ResizeObserver(() => updateUnitWidth());
    if (unitRef.current) ro.observe(unitRef.current);
    window.addEventListener("resize", updateUnitWidth);

    // Also re-measure after fonts & images settle
    const t1 = setTimeout(updateUnitWidth, 300);
    const t2 = setTimeout(updateUnitWidth, 1200);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", updateUnitWidth);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [children, updateUnitWidth]);

  // ---- Continuous Animation loop --------------------------------------------
  useEffect(() => {
    let raf = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05); // clamp tab-switch spikes
      last = now;

      // Lazy measure on first few frames if ResizeObserver hasn't fired yet
      if (state.unitWidth <= 0 && unitRef.current) {
        const w = unitRef.current.scrollWidth || unitRef.current.offsetWidth;
        if (w > 0) state.unitWidth = w;
      }

      // Smooth deceleration on hover (50% speed so it remains visibly in motion and never looks frozen)
      const want = state.dragging ? 0 : state.hovered ? speed * 0.5 : speed;
      state.current += (want - state.current) * Math.min(1, dt * 6);

      const uw = state.unitWidth;
      if (!state.dragging && uw > 0) {
        state.pos += state.current * dt;
        state.pos = ((state.pos % uw) + uw) % uw;
      }

      if (viewportRef.current && uw > 0) {
        // right-to-left: translates from 0 to -uw (items glide left ←)
        // left-to-right: translates from -uw to 0 (items glide right →)
        const offset =
          direction === "right-to-left"
            ? -(state.pos % uw)
            : -uw + (state.pos % uw);

        viewportRef.current.style.transform = `translate3d(${offset}px,0,0)`;
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [direction, speed, state]);

  // ---- Manual arrow nudge --------------------------------------------------
  const gapPx = 20;
  const nudge = useCallback(
    (dir: 1 | -1) => {
      const uw = state.unitWidth;
      if (uw <= 0) return;
      const first = unitRef.current?.firstElementChild as HTMLElement | null;
      const stepSize = first ? first.offsetWidth + gapPx : uw / 4;
      const step = direction === "right-to-left" ? dir * stepSize : -dir * stepSize;
      state.pos = (((state.pos + step) % uw) + uw) % uw;
    },
    [direction, state],
  );

  // ---- Touch / pointer drag ------------------------------------------------
  const onPointerDown = (e: React.PointerEvent) => {
    state.dragging = true;
    setDraggingState(true);
    state.lastPointer = e.clientX;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const uw = state.unitWidth;
    if (!state.dragging || uw <= 0) return;
    const delta = e.clientX - state.lastPointer;
    state.lastPointer = e.clientX;
    const step = direction === "right-to-left" ? -delta : delta;
    state.pos = (((state.pos + step) % uw) + uw) % uw;
  };

  const endDrag = (e: React.PointerEvent) => {
    if (!state.dragging) return;
    const uw = state.unitWidth;
    const fling = e.clientX - state.lastPointer;
    state.dragging = false;
    setDraggingState(false);
    if (uw > 0) {
      const step = direction === "right-to-left" ? -fling : fling;
      state.pos = (((state.pos + step) % uw) + uw) % uw;
    }
  };

  return (
    <div
      className={`relative ${className}`}
      onMouseEnter={() => {
        state.hovered = true;
      }}
      onMouseLeave={() => {
        state.hovered = false;
      }}
    >
      <div
        role="region"
        aria-label={ariaLabel}
        aria-roledescription="carousel"
        className="marquee-mask cursor-grab overflow-hidden active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        style={{ touchAction: "pan-y" }}
      >
        <div ref={viewportRef} className="flex w-max will-change-transform">
          {/* 4 identical track copies ensure continuous wrap with zero seam and zero gap */}
          {[0, 1, 2, 3].map((copyIndex) => (
            <div
              key={copyIndex}
              ref={copyIndex === 0 ? unitRef : undefined}
              className="flex shrink-0 gap-5 pr-5"
              aria-hidden={copyIndex > 0}
            >
              {children}
            </div>
          ))}
        </div>
      </div>

      {/* Desktop-only manual controls */}
      <button
        type="button"
        onClick={() => nudge(-1)}
        aria-label="Previous items"
        className="absolute -left-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-copper/40 bg-deep/85 text-champagne backdrop-blur transition-all hover:border-copper hover:bg-espresso md:grid"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        type="button"
        onClick={() => nudge(1)}
        aria-label="Next items"
        className="absolute -right-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-copper/40 bg-deep/85 text-champagne backdrop-blur transition-all hover:border-copper hover:bg-espresso md:grid"
      >
        <ChevronRight size={20} />
      </button>

      {draggingState && (
        <span className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-widest text-champagne/60">
          Release to resume
        </span>
      )}
    </div>
  );
}

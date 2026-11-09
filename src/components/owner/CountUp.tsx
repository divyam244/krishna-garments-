"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Animated number counter for the KPI tiles. Uses rAF so it settles exactly on
 * the target value; honours reduced-motion by jumping straight to the number.
 */
export default function CountUp({
  value,
  format = (n) => Math.round(n).toLocaleString("en-IN"),
  duration = 1100,
}: {
  value: number;
  format?: (n: number) => string;
  duration?: number;
}) {
  const [display, setDisplay] = useState(0);
  const from = useRef(0);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || value === 0) {
      setDisplay(value);
      from.current = value;
      return;
    }

    let raf = 0;
    const start = performance.now();
    const begin = from.current;
    const delta = value - begin;

    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(begin + delta * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
      else from.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <>{format(display)}</>;
}

"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/** Multi-image gallery with thumbnails + touch swipe (brief section 9). */
export default function Gallery({ images, name }: { images: string[]; name: string }) {
  const [i, setI] = useState(0);
  const list = images.length ? images : [""];
  const total = list.length;

  // Keep the live index in a ref so touch handlers never read a stale closure.
  const indexRef = useRef(i);
  indexRef.current = i;

  const step = (delta: number) => setI((indexRef.current + delta + total) % total);

  const touchX = useRef(0);
  const onTouchStart = (e: React.TouchEvent) => {
    touchX.current = e.touches[0]?.clientX ?? 0;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (total < 2) return;
    const end = e.changedTouches[0]?.clientX ?? touchX.current;
    const delta = end - touchX.current;
    if (Math.abs(delta) < 45) return;
    step(delta < 0 ? 1 : -1);
  };

  return (
    <div className="flex flex-col gap-3">
      <div
        className="relative aspect-[3/4] overflow-hidden rounded-xl border border-copper/25 bg-deep"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {list.map((src, idx) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`${src}-${idx}`}
            src={src}
            alt={`${name} — view ${idx + 1}`}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
              idx === i ? "opacity-100" : "opacity-0"
            }`}
            loading={idx === 0 ? "eager" : "lazy"}
            fetchPriority={idx === i ? "high" : "low"}
          />
        ))}

        {total > 1 && (
          <>
            <GalleryButton side="left" onClick={() => step(-1)} />
            <GalleryButton side="right" onClick={() => step(1)} />
            <span className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-[0.2em] text-ivory/45 md:hidden">
              Swipe
            </span>
          </>
        )}
      </div>

      {total > 1 && (
        <ul className="flex gap-3">
          {list.map((src, idx) => (
            <li key={`thumb-${src}-${idx}`}>
              <button
                type="button"
                onClick={() => setI(idx)}
                aria-label={`Show image ${idx + 1} of ${total}`}
                aria-current={idx === i}
                className={`h-24 w-[74px] overflow-hidden rounded border transition-all ${
                  idx === i ? "border-champagne opacity-100" : "border-copper/25 opacity-55 hover:opacity-85"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function GalleryButton({ side, onClick }: { side: "left" | "right"; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === "left" ? "Previous image" : "Next image"}
      className={`absolute top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-copper/40 bg-charcoal/75 text-champagne backdrop-blur transition-all hover:bg-espresso ${
        side === "left" ? "left-3" : "right-3"
      }`}
    >
      {side === "left" ? <ChevronLeft size={17} /> : <ChevronRight size={17} />}
    </button>
  );
}

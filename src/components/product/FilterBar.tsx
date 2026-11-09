"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X, ChevronDown } from "lucide-react";
import type { ProductView } from "@/lib/catalogue";
import ProductCard from "@/components/product/ProductCard";

export type Facets = {
  sizes: string[];
  colours: string[];
  collections: { slug: string; name: string }[];
  availabilities: string[];
  priceMin: number;
  priceMax: number;
};

const AVAIL_LABEL: Record<string, string> = {
  IN_STOCK: "In stock",
  LOW_STOCK: "Low stock",
  MADE_TO_ORDER: "Made to order",
  OUT_OF_STOCK: "Enquire only",
};

const SORTS = [
  ["new", "Newest"],
  ["price-asc", "Price: low to high"],
  ["price-desc", "Price: high to low"],
  ["popular", "Most loved"],
] as const;

export default function FilterBar({
  items,
  facets,
  categories,
}: {
  items: ProductView[];
  facets: Facets;
  categories: { slug: string; name: string }[];
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Local state mirrors the URL so typing in price sliders feels instant.
  const [draft, setDraft] = useState(() => readState(params));

  useEffect(() => setDraft(readState(params)), [params]);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  /** Push draft -> querystring; the server component re-renders filtered rows. */
  const apply = useCallback(
    (next: typeof draft) => {
      setDraft(next);
      const sp = new URLSearchParams();
      if (next.category) sp.set("category", next.category);
      if (next.size) sp.set("size", next.size);
      if (next.colour) sp.set("colour", next.colour);
      if (next.collection) sp.set("collection", next.collection);
      if (next.availability) sp.set("availability", next.availability);
      if (next.tag) sp.set("tag", next.tag);
      if (next.sale) sp.set("sale", "1");
      if (next.min > facets.priceMin) sp.set("min", String(next.min));
      if (next.max < facets.priceMax) sp.set("max", String(next.max));
      if (next.sort !== "new") sp.set("sort", next.sort);
      if (next.q) sp.set("q", next.q);
      router.push(`/clothing${sp.toString() ? `?${sp}` : ""}`, { scroll: false });
    },
    [facets.priceMax, facets.priceMin, router],
  );

  const activeCount = useMemo(
    () =>
      [
        draft.category,
        draft.size,
        draft.colour,
        draft.collection,
        draft.availability,
        draft.tag,
        draft.sale ? "s" : "",
        draft.min > facets.priceMin ? "m" : "",
      ].filter(Boolean).length,
    [draft, facets.priceMin],
  );

  const clearAll = () => {
    setDraft({ ...emptyState, q: draft.q });
    router.push(draft.q ? `/clothing?q=${encodeURIComponent(draft.q)}` : "/clothing", { scroll: false });
  };

  return (
    <div className="sticky top-[68px] z-40 -mx-6 border-y border-copper/20 bg-charcoal/95 px-6 py-3 backdrop-blur-xl md:top-[72px] md:mx-0 md:px-0">
      <div className="flex flex-wrap items-center gap-3">
        {/* Filters toggle */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="btn-outline btn-sm relative"
        >
          <SlidersHorizontal size={14} /> Filters
          {activeCount > 0 && (
            <span className="ml-1 grid h-4 w-4 place-items-center rounded-full bg-copper text-[9px] text-charcoal">
              {activeCount}
            </span>
          )}
        </button>

        {activeCount > 0 && (
          <button type="button" onClick={clearAll} className="text-[11px] uppercase tracking-[0.16em] text-ivory/45 underline underline-offset-4 hover:text-champagne">
            Clear all
          </button>
        )}

        <span className="ml-auto text-[11px] uppercase tracking-[0.18em] text-ivory/45">
          {items.length} piece{items.length === 1 ? "" : "s"}
        </span>

        {/* Sort */}
        <label className="relative flex items-center">
          <span className="sr-only">Sort products</span>
          <select
            value={draft.sort}
            onChange={(e) => apply({ ...draft, sort: e.target.value })}
            className="appearance-none rounded-sm border border-copper/30 bg-deep py-2 pl-3 pr-9 text-[12px] text-ivory/80 outline-none hover:border-copper/60"
          >
            {SORTS.map(([v, label]) => (
              <option key={v} value={v}>
                {label}
              </option>
            ))}
          </select>
          <ChevronDown size={14} className="pointer-events-none absolute right-3 text-champagne/70" />
        </label>
      </div>

      {/* Active chips */}
      {activeCount > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {(
            [
              ["category", draft.category],
              ["size", draft.size],
              ["colour", draft.colour],
              ["collection", draft.collection],
              ["availability", draft.availability],
              ["tag", draft.tag],
            ] as const
          )
            .filter(([, v]) => Boolean(v))
            .map(([key, value]) => (
              <li key={key}>
                <button
                  type="button"
                  onClick={() => apply({ ...draft, [key]: "" })}
                  className="chip hover:border-copper hover:text-champagne"
                >
                  {key === "availability" ? AVAIL_LABEL[String(value)] ?? value : value}
                  <X size={12} />
                </button>
              </li>
            ))}
          {draft.sale && (
            <li>
              <button type="button" onClick={() => apply({ ...draft, sale: false })} className="chip hover:border-copper">
                On sale <X size={12} />
              </button>
            </li>
          )}
        </ul>
      )}

      {/* Filter panel */}
      {open && (
        <div ref={panelRef} className="mt-4 grid gap-6 rounded-lg border border-copper/25 bg-deep p-6 shadow-card sm:grid-cols-2 lg:grid-cols-3">
          <Group label="Category">
            <Wrap>
              <Pill active={!draft.category} onClick={() => apply({ ...draft, category: "" })}>
                All
              </Pill>
              {categories.map((c) => (
                <Pill key={c.slug} active={draft.category === c.slug} onClick={() => apply({ ...draft, category: c.slug })}>
                  {c.name}
                </Pill>
              ))}
            </Wrap>
          </Group>

          <Group label="Size">
            <Wrap>
              {facets.sizes.map((s) => (
                <Pill key={s} active={draft.size === s} onClick={() => apply({ ...draft, size: draft.size === s ? "" : s })}>
                  {s}
                </Pill>
              ))}
            </Wrap>
          </Group>

          <Group label="Colour">
            <Wrap>
              {facets.colours.map((c) => (
                <Pill key={c} active={draft.colour === c} onClick={() => apply({ ...draft, colour: draft.colour === c ? "" : c })}>
                  {c}
                </Pill>
              ))}
            </Wrap>
          </Group>

          <Group label="Collection">
            <Wrap>
              {facets.collections.map((c) => (
                <Pill
                  key={c.slug}
                  active={draft.collection === c.slug}
                  onClick={() => apply({ ...draft, collection: draft.collection === c.slug ? "" : c.slug })}
                >
                  {c.name.replace(" Collection", "")}
                </Pill>
              ))}
            </Wrap>
          </Group>

          <Group label="Availability">
            <Wrap>
              {facets.availabilities.map((a) => (
                <Pill
                  key={a}
                  active={draft.availability === a}
                  onClick={() => apply({ ...draft, availability: draft.availability === a ? "" : a })}
                >
                  {AVAIL_LABEL[a]}
                </Pill>
              ))}
            </Wrap>
          </Group>

          <Group label={`Price — ₹${draft.min.toLocaleString("en-IN")} to ₹${draft.max.toLocaleString("en-IN")}`}>
            <div className="flex flex-col gap-3 pt-1">
              <input
                type="range"
                min={facets.priceMin}
                max={facets.priceMax}
                step={100}
                value={draft.min}
                onChange={(e) => setDraft({ ...draft, min: Number(e.target.value) })}
                onMouseUp={(e) => apply({ ...draft, min: Number((e.target as HTMLInputElement).value) })}
                onTouchEnd={(e) => apply({ ...draft, min: Number((e.target as HTMLInputElement).value) })}
                aria-label="Minimum price"
                className="accent-copper"
              />
              <input
                type="range"
                min={facets.priceMin}
                max={facets.priceMax}
                step={100}
                value={draft.max}
                onChange={(e) => setDraft({ ...draft, max: Number(e.target.value) })}
                onMouseUp={(e) => apply({ ...draft, max: Number((e.target as HTMLInputElement).value) })}
                onTouchEnd={(e) => apply({ ...draft, max: Number((e.target as HTMLInputElement).value) })}
                aria-label="Maximum price"
                className="accent-copper"
              />
            </div>
          </Group>

          <Group label="Occasion">
            <Wrap>
              <Pill active={draft.tag === "new"} onClick={() => apply({ ...draft, tag: draft.tag === "new" ? "" : "new" })}>
                New arrivals
              </Pill>
              <Pill active={draft.sale} onClick={() => apply({ ...draft, sale: !draft.sale })}>
                On sale
              </Pill>
            </Wrap>
          </Group>
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ helpers ---

const emptyState = {
  category: "",
  size: "",
  colour: "",
  collection: "",
  availability: "",
  tag: "",
  sale: false,
  min: 0,
  max: 10000,
  sort: "new",
  q: "",
};

type State = typeof emptyState;

function readState(params: URLSearchParams): State {
  return {
    category: params.get("category") ?? "",
    size: params.get("size") ?? "",
    colour: params.get("colour") ?? "",
    collection: params.get("collection") ?? "",
    availability: params.get("availability") ?? "",
    tag: params.get("tag") ?? "",
    sale: params.get("sale") === "1",
    min: Number(params.get("min") ?? 0),
    max: Number(params.get("max") ?? 10000),
    sort: params.get("sort") ?? "new",
    q: params.get("q") ?? "",
  };
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <fieldset className="min-w-0">
      <legend className="label">{label}</legend>
      {children}
    </fieldset>
  );
}

function Wrap({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap gap-2">{children}</div>;
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-3 py-1.5 text-[11.5px] transition-colors ${
        active
          ? "border-copper bg-copper/18 text-champagne"
          : "border-ivory/18 text-ivory/60 hover:border-copper/55 hover:text-champagne"
      }`}
    >
      {children}
    </button>
  );
}

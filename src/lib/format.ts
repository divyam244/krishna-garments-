/** Formatting helpers shared by storefront and owner dashboard. */

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function money(value: number | string | null | undefined, opts: { dash?: string } = {}): string {
  if (value === null || value === undefined || value === "") return opts.dash ?? "Enquire";
  const n = typeof value === "string" ? Number(value) : value;
  return Number.isFinite(n) ? inr.format(n) : (opts.dash ?? "—");
}

/** Indian short-scale: 18,42,500 -> "₹18.4L" for KPI tiles. */
export function compactMoney(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_00_00_000) return `₹${(value / 1_00_00_000).toFixed(2)}Cr`;
  if (abs >= 1_00_000) return `₹${(value / 1_00_000).toFixed(1)}L`;
  if (abs >= 1_000) return `₹${(value / 1_000).toFixed(1)}K`;
  return `₹${Math.round(value)}`;
}

export function num(value: number): string {
  return new Intl.NumberFormat("en-IN").format(Math.round(value));
}

export function date(d: Date | string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function daysFromNow(d: Date | string | null | undefined): { label: string; overdue: boolean } {
  if (!d) return { label: "No due date", overdue: false };
  const diff = Math.ceil((new Date(d).getTime() - Date.now()) / 86_400_000);
  if (diff < 0) return { label: `${Math.abs(diff)} days overdue`, overdue: true };
  if (diff === 0) return { label: "Due today", overdue: true };
  return { label: `${diff} days`, overdue: false };
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function titleCase(s: string): string {
  return s.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

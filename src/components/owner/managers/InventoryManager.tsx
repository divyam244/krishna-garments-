"use client";

import { useMemo, useState } from "react";
import { Plus, PackagePlus, PackageMinus, Pencil, Boxes } from "lucide-react";
import DataTable, { StatusPill } from "@/components/owner/DataTable";
import FormModal, { type Field } from "@/components/owner/FormModal";
import { PageHeader } from "./OrdersManager";
import { money, num } from "@/lib/format";
import { useSite } from "@/components/providers/SiteProviders";

export type ProductRow = {
  id: string;
  sku: string;
  name: string;
  category: string;
  categoryId: string;
  price: number | null;
  mrp: number | null;
  stockOnHand: number;
  minOrderQty: number;
  availability: string;
  sizes: string[];
  colours: { name: string; hex: string }[];
  fabric: string;
  description: string;
  isNewArrival: boolean;
  onSale: boolean;
  priceOnRequest: boolean;
  image: string;
  isSample: boolean;
};

const AVAIL_MAP: Record<string, { label: string; tone: string }> = {
  IN_STOCK: { label: "In stock", tone: "border-ok/50 bg-ok/12 text-ok" },
  LOW_STOCK: { label: "Low", tone: "border-warn/50 bg-warn/12 text-warn" },
  MADE_TO_ORDER: { label: "Made to order", tone: "border-copper/50 bg-copper/12 text-champagne" },
  OUT_OF_STOCK: { label: "Out of stock", tone: "border-danger/50 bg-danger/12 text-danger" },
};

const LOW_THRESHOLD = 20;

export default function InventoryManager({
  initial,
  categories,
}: {
  initial: ProductRow[];
  categories: { id: string; name: string }[];
}) {
  const { toast } = useSite();
  const [rows, setRows] = useState(initial);
  const [editing, setEditing] = useState<ProductRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [adjusting, setAdjusting] = useState<ProductRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const stats = useMemo(() => {
    const units = rows.reduce((s, r) => s + r.stockOnHand, 0);
    const value = rows.reduce((s, r) => s + (r.price ?? 0) * r.stockOnHand, 0);
    return {
      units,
      value,
      low: rows.filter((r) => r.stockOnHand <= LOW_THRESHOLD).length,
      skus: rows.length,
    };
  }, [rows]);

  async function save(data: Record<string, string | number | boolean>) {
    setBusy(true);
    setError("");
    try {
      const body = {
        ...(editing ? { id: editing.id } : {}),
        name: data.name,
        categoryId: data.categoryId,
        description: data.description,
        fabric: data.fabric,
        price: data.price === "" || data.priceOnRequest ? null : Number(data.price),
        mrp: data.mrp === "" ? null : Number(data.mrp),
        sizes: String(data.sizes || "S,M,L").split(",").map((s) => s.trim()).filter(Boolean),
        colours: parseColours(String(data.colours || "")),
        stockOnHand: Number(data.stockOnHand || 0),
        minOrderQty: Number(data.minOrderQty || 1),
        availability: data.availability,
        isNewArrival: Boolean(data.isNewArrival),
        onSale: Boolean(data.onSale),
        priceOnRequest: Boolean(data.priceOnRequest),
        image: data.image,
      };

      const res = await fetch("/api/owner/products", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Could not save the product.");

      toast(editing ? `${data.name} updated` : `${data.name} added to catalogue`, "success");
      setEditing(null);
      setCreating(false);
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function refresh() {
    try {
      const res = await fetch("/api/owner/products");
      if (res.ok) setRows(await res.json());
    } catch {
      /* keep current rows */
    }
  }

  const fields: Field[] = [
    { name: "name", label: "Product name", type: "text", required: true, placeholder: "Embroidered Jacket" },
    {
      name: "categoryId",
      label: "Category",
      type: "select",
      required: true,
      options: categories.map((c) => ({ value: c.id, label: c.name })),
    },
    { name: "price", label: "Retail price (₹)", type: "number", placeholder: "2999", help: "Leave blank for enquiry-only pieces." },
    { name: "mrp", label: "MRP / list price (₹)", type: "number", placeholder: "3599" },
    { name: "stockOnHand", label: "Stock on hand", type: "number", required: true, placeholder: "40" },
    { name: "minOrderQty", label: "Minimum order qty", type: "number", required: true, placeholder: "1" },
    {
      name: "availability",
      label: "Availability",
      type: "select",
      options: Object.entries(AVAIL_MAP).map(([value, v]) => ({ value, label: v.label })),
    },
    { name: "fabric", label: "Material", type: "text", placeholder: "Textured crepe with gold-thread embroidery" },
    { name: "sizes", label: "Sizes (comma separated)", type: "text", span: 2, placeholder: "XS,S,M,L,XL" },
    {
      name: "colours",
      label: "Colours (name #hex, comma separated)",
      type: "text",
      span: 2,
      placeholder: "Champagne #D49A60, Copper #B87333, Ivory #E9D9C5",
      help: "Used for the colour swatches on the storefront.",
    },
    { name: "description", label: "Description", type: "textarea", required: true, placeholder: "How it is cut, finished and worn…" },
    { name: "image", label: "Image path or URL", type: "text", span: 2, placeholder: "/images/products/jacket-01.jpg", help: "Blank keeps the generated placeholder artwork." },
    { name: "isNewArrival", label: "Show in New Arrivals", type: "checkbox" },
    { name: "onSale", label: "Mark as sale", type: "checkbox" },
    { name: "priceOnRequest", label: "Price on enquiry only", type: "checkbox" },
  ];

  const valuesFor = (p: ProductRow) => ({
    name: p.name,
    categoryId: p.categoryId,
    price: p.price ?? "",
    mrp: p.mrp ?? "",
    stockOnHand: p.stockOnHand,
    minOrderQty: p.minOrderQty,
    availability: p.availability,
    fabric: p.fabric,
    sizes: p.sizes.join(","),
    colours: p.colours.map((c) => `${c.name} ${c.hex}`).join(", "),
    description: p.description,
    image: p.image,
    isNewArrival: p.isNewArrival,
    onSale: p.onSale,
    priceOnRequest: p.priceOnRequest,
  });

  return (
    <>
      <PageHeader title="Inventory" subtitle="Catalogue, stock levels and material details." count={rows.length}>
        <button type="button" onClick={() => setCreating(true)} className="btn-solid btn-sm">
          <Plus size={14} /> Add Product
        </button>
      </PageHeader>

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Total units" value={num(stats.units)} />
        <Stat label="Stock value" value={money(stats.value)} />
        <Stat label="Styles live" value={num(stats.skus)} />
        <Stat label="At or below 20 pcs" value={num(stats.low)} tone={stats.low > 0 ? "text-warn" : "text-ok"} />
      </div>

      <DataTable
        rows={rows}
        rowKey={(r) => r.id}
        emptyText="No products yet. Add your first style — everything on the storefront reads from here."
        pageSize={15}
        columns={[
          { key: "sku", header: "SKU", render: (r) => <span className="whitespace-nowrap text-[12px] text-ivory/55">{r.sku}</span> },
          { key: "name", header: "Product", search: (r) => `${r.name} ${r.sku} ${r.category}` },
          { key: "category", header: "Category", render: (r) => <span className="text-ivory/60">{r.category}</span> },
          { key: "price", header: "Price", render: (r) => (r.priceOnRequest || r.price == null ? <span className="text-[12px] text-champagne/70">Enquire</span> : <span className="tabular-nums">{money(r.price)}</span>), search: (r) => String(r.price ?? "") },
          {
            key: "stockOnHand",
            header: "Stock",
            render: (r) => (
              <span className={`tabular-nums ${r.stockOnHand === 0 ? "text-danger" : r.stockOnHand <= LOW_THRESHOLD ? "text-warn" : "text-ivory/80"}`}>
                {num(r.stockOnHand)} pcs
              </span>
            ),
            search: (r) => String(r.stockOnHand),
          },
          { key: "availability", header: "Status", render: (r) => <StatusPill value={r.availability} map={AVAIL_MAP} /> },
          { key: "sizes", header: "Sizes", render: (r) => <span className="text-[11.5px] text-ivory/50">{r.sizes.join(" · ") || "—"}</span>, search: (r) => r.sizes.join(" ") },
        ]}
        actions={(r) => (
          <div className="flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => setAdjusting(r)} aria-label={`Adjust stock for ${r.name}`} className="grid h-8 w-8 place-items-center rounded border border-copper/30 text-champagne hover:bg-espresso">
              <Boxes size={13} />
            </button>
            <button type="button" onClick={() => setEditing(r)} aria-label={`Edit ${r.name}`} className="grid h-8 w-8 place-items-center rounded border border-copper/30 text-champagne hover:bg-espresso">
              <Pencil size={13} />
            </button>
          </div>
        )}
      />

      {(creating || editing) && (
        <FormModal
          title={editing ? `Edit — ${editing.name}` : "Add Product"}
          fields={fields}
          values={editing ? valuesFor(editing) : undefined}
          busy={busy}
          error={error}
          submitLabel={editing ? "Save changes" : "Add to catalogue"}
          onSubmit={save}
          onClose={() => { setCreating(false); setEditing(null); setError(""); }}
        />
      )}

      {adjusting && (
        <StockAdjust product={adjusting} onClose={() => setAdjusting(null)} onSaved={refresh} />
      )}
    </>
  );
}

function StockAdjust({
  product,
  onClose,
  onSaved,
}: {
  product: ProductRow;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const { toast } = useSite();
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [mode, setMode] = useState<"IN" | "OUT">("IN");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const signed = mode === "IN" ? Number(quantity) : -Number(quantity);
      const res = await fetch("/api/owner/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, quantity: signed, reason }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Could not adjust stock.");
      toast(`${product.name}: ${json.stockOnHand} pcs on hand`, "success");
      await onSaved();
      onClose();
    } catch (e2) {
      setError((e2 as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[95] grid place-items-center bg-ink/85 p-4 backdrop-blur-sm" onClick={onClose} role="dialog" aria-modal="true" aria-label={`Adjust stock for ${product.name}`}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-xl border border-copper/30 bg-deep p-6 shadow-card">
        <h2 className="font-display text-[22px]">Adjust stock</h2>
        <p className="mt-1 text-[13px] text-ivory/55">
          {product.name} · currently <span className="text-champagne">{num(product.stockOnHand)} pcs</span>
        </p>

        <div className="mt-5 grid grid-cols-2 gap-2">
          {(["IN", "OUT"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`flex items-center justify-center gap-2 rounded border px-3 py-2.5 text-[12px] uppercase tracking-[0.14em] transition-colors ${
                mode === m ? "border-copper bg-copper/15 text-champagne" : "border-ivory/18 text-ivory/55 hover:border-copper/50"
              }`}
            >
              {m === "IN" ? <PackagePlus size={14} /> : <PackageMinus size={14} />}
              {m === "IN" ? "Receive" : "Issue out"}
            </button>
          ))}
        </div>

        <label className="mt-4 block">
          <span className="label">Quantity *</span>
          <input autoFocus type="number" min={1} required value={quantity} onChange={(e) => setQuantity(e.target.value)} className="field" placeholder="50" />
        </label>

        <label className="mt-4 block">
          <span className="label">Reason</span>
          <input value={reason} onChange={(e) => setReason(e.target.value)} className="field" placeholder="Supplier delivery / dispatched order / correction" />
        </label>

        {quantity !== "" && Number(quantity) > 0 && (
          <p className="mt-3 rounded border border-copper/25 bg-charcoal/50 px-3 py-2 text-[12.5px] text-ivory/60">
            New level:{" "}
            <span className="text-champagne">
              {num(Math.max(0, product.stockOnHand + (mode === "IN" ? Number(quantity) : -Number(quantity))))} pcs
            </span>
          </p>
        )}

        {error && <p role="alert" className="mt-3 rounded border border-danger/45 bg-danger/10 px-3 py-2 text-[12.5px] text-danger">{error}</p>}

        <div className="mt-5 flex gap-3">
          <button type="submit" disabled={saving} className="btn-solid flex-1">{saving ? "Saving…" : "Record movement"}</button>
          <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
        </div>
      </form>
    </div>
  );
}

export function Stat({ label, value, tone = "text-champagne" }: { label: string; value: string; tone?: string }) {
  return (
    <div className="card-espresso px-5 py-4">
      <p className="text-[11px] uppercase tracking-[0.18em] text-ivory/45">{label}</p>
      <p className={`mt-1.5 font-display text-[24px] leading-none ${tone}`}>{value}</p>
    </div>
  );
}

/** "Champagne #D49A60, Copper #B87333" -> [{name,hex}] */
function parseColours(input: string) {
  return input
    .split(",")
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const match = chunk.match(/^(.*?)(#[0-9A-Fa-f]{6})$/);
      if (match) return { name: match[1].trim() || "Copper", hex: match[2] };
      const named: Record<string, string> = {
        ivory: "#E9D9C5", champagne: "#D49A60", copper: "#B87333", charcoal: "#1D1916",
        rosewood: "#7E3F4B", blush: "#D9A6A0", indigo: "#3B5A78", ecru: "#E3DACB", black: "#121110",
      };
      return { name: chunk, hex: named[chunk.toLowerCase()] ?? "#B87333" };
    })
    .slice(0, 8);
}

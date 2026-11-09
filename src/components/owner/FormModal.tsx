"use client";

import { useEffect, useState } from "react";
import { X, Loader2 } from "lucide-react";

/**
 * Generic owner form modal. Renders fields from a declarative spec so each of
 * the nine dashboard sections can create/edit without duplicating form code.
 */
export type Field =
  | { name: string; label: string; type: "text" | "email" | "tel" | "password" | "number" | "date" | "textarea" | "select"; options?: { value: string; label: string }[]; required?: boolean; placeholder?: string; span?: 1 | 2; help?: string }
  | { name: string; label: string; type: "checkbox"; span?: 1 | 2 };

type Props = {
  title: string;
  fields: Field[];
  values?: Record<string, string | number | boolean>;
  busy: boolean;
  error?: string;
  submitLabel?: string;
  onSubmit: (data: Record<string, string | number | boolean>) => void | Promise<void>;
  onClose: () => void;
};

export default function FormModal({ title, fields, values, busy, error, submitLabel = "Save", onSubmit, onClose }: Props) {
  const [form, setForm] = useState<Record<string, string | number | boolean>>(() => defaults(fields, values));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const set = (name: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const el = e.target as HTMLInputElement;
    setForm((f) => ({ ...f, [name]: el.type === "checkbox" ? el.checked : el.value }));
  };

  return (
    <div className="fixed inset-0 z-[95] grid place-items-center bg-ink/85 p-4 backdrop-blur-sm" onClick={onClose} role="dialog" aria-modal="true" aria-label={title}>
      <div onClick={(e) => e.stopPropagation()} className="max-h-[92svh] w-full max-w-2xl overflow-y-auto rounded-xl border border-copper/30 bg-deep shadow-card">
        <header className="sticky top-0 flex items-center justify-between gap-4 border-b border-copper/25 bg-deep px-6 py-4">
          <h2 className="font-display text-[22px]">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close form" className="grid h-9 w-9 place-items-center rounded-full border border-copper/35 text-champagne hover:bg-espresso">
            <X size={15} />
          </button>
        </header>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void onSubmit(form);
          }}
          className="grid gap-4 p-6 sm:grid-cols-2"
        >
          {fields.map((f) => (
            <label key={f.name} className={`block min-w-0 ${f.span === 2 || f.type === "textarea" ? "sm:col-span-2" : ""}`}>
              {f.type !== "checkbox" && <span className="label">{f.label}{f.required && " *"}</span>}

              {f.type === "textarea" ? (
                <textarea rows={3} value={String(form[f.name] ?? "")} onChange={set(f.name)} required={f.required} placeholder={f.placeholder} className="field resize-y" />
              ) : f.type === "select" ? (
                <select value={String(form[f.name] ?? "")} onChange={set(f.name)} required={f.required} className="field">
                  {(f.options ?? []).map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              ) : f.type === "checkbox" ? (
                <span className="flex items-center gap-3 rounded border border-copper/25 bg-charcoal/50 px-3 py-2.5">
                  <input type="checkbox" checked={Boolean(form[f.name])} onChange={set(f.name)} className="h-4 w-4 accent-copper" />
                  <span className="text-[13px] text-ivory/78">{f.label}</span>
                </span>
              ) : (
                <input
                  type={f.type === "password" ? "password" : f.type}
                  value={String(form[f.name] ?? "")}
                  onChange={set(f.name)}
                  required={f.required}
                  placeholder={f.placeholder}
                  step={f.type === "number" ? "any" : undefined}
                  min={f.type === "number" ? 0 : undefined}
                  autoComplete={f.type === "password" ? "new-password" : undefined}
                  className="field"
                />
              )}

              {"help" in f && f.help && <span className="mt-1 block text-[11px] leading-relaxed text-ivory/40">{f.help}</span>}
            </label>
          ))}

          {error && (
            <p role="alert" className="rounded border border-danger/45 bg-danger/10 px-3 py-2.5 text-[12.5px] text-danger sm:col-span-2">
              {error}
            </p>
          )}

          <div className="flex flex-wrap gap-3 pt-2 sm:col-span-2">
            <button type="submit" disabled={busy} className="btn-solid sheen">
              {busy ? (<><Loader2 size={15} className="animate-spin" /> Saving…</>) : submitLabel}
            </button>
            <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function defaults(fields: Field[], values?: Record<string, string | number | boolean>) {
  const out: Record<string, string | number | boolean> = {};
  for (const f of fields) {
    if (values && f.name in values) out[f.name] = values[f.name];
    else if (f.type === "checkbox") out[f.name] = false;
    else if (f.type === "number") out[f.name] = "";
    else if (f.type === "select") out[f.name] = f.options?.[0]?.value ?? "";
    else out[f.name] = "";
  }
  return out;
}

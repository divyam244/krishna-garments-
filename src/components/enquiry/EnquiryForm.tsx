"use client";

import { useState } from "react";
import { Send, CheckCircle2, MessageCircle, Loader2 } from "lucide-react";

export type EnquiryType = "WHOLESALE" | "BULK_ORDER" | "CUSTOM_STITCHING" | "MANUFACTURING" | "GENERAL";

const TYPES: { value: EnquiryType; label: string; hint: string }[] = [
  { value: "WHOLESALE", label: "Wholesale enquiry", hint: "Ongoing supply for your store or chain." },
  { value: "BULK_ORDER", label: "Bulk order", hint: "One large order of existing styles." },
  { value: "CUSTOM_STITCHING", label: "Custom stitching", hint: "Your design or measurements, made for you." },
  { value: "MANUFACTURING", label: "Manufacturing enquiry", hint: "Contract manufacturing / private label." },
];

type Props = {
  presetType?: EnquiryType;
  presetProducts?: string;
  compact?: boolean;
};

/** Section 10 — business enquiry form. Posts to /api/enquiries. */
export default function EnquiryForm({ presetType = "WHOLESALE", presetProducts = "", compact = false }: Props) {
  const [form, setForm] = useState({
    type: presetType,
    name: "",
    businessName: "",
    phone: "",
    email: "",
    city: "",
    products: presetProducts,
    quantity: "",
    message: "",
  });
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [result, setResult] = useState<{ reference?: string; message?: string; whatsappUrl?: string }>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    if (errors[k]) setErrors((prev) => ({ ...prev, [k]: "" }));
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    setErrors({});
    try {
      const res = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.fields) setErrors(data.fields);
        throw new Error(data.error ?? "We could not send that. Please try again.");
      }
      setResult(data);
      setState("done");
    } catch (err) {
      setState("error");
      setResult({ message: (err as Error).message });
    }
  }

  if (state === "done") {
    return (
      <div className="card flex flex-col gap-4 p-7" role="status">
        <span className="flex items-center gap-3 text-ok">
          <CheckCircle2 size={22} />
          <strong className="font-display text-2xl">Enquiry received</strong>
        </span>
        <p className="text-sm leading-relaxed text-ivory/65">
          Your reference number is <span className="text-champagne">{result.reference}</span>. Our desk will respond
          with costing and a sample timeline — usually within one working day.
        </p>
        {result.whatsappUrl ? (
          <a href={result.whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn-solid w-fit">
            <MessageCircle size={15} /> Continue on WhatsApp
          </a>
        ) : (
          <p className="text-[11px] text-ivory/40">
            WhatsApp is not configured yet, so we will reply by email and phone.
          </p>
        )}
        <button
          type="button"
          onClick={() => {
            setState("idle");
            setForm((f) => ({ ...f, message: "", quantity: "" }));
          }}
          className="btn-ghost w-fit"
        >
          Send another enquiry
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card flex flex-col gap-5 p-6 md:p-7" noValidate>
      {/* Enquiry type selector */}
      <fieldset>
        <legend className="label">What do you need?</legend>
        <div className={`grid gap-2 ${compact ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-4"}`}>
          {TYPES.map((t) => (
            <label
              key={t.value}
              className={`cursor-pointer rounded border px-3 py-2.5 text-[12px] leading-snug transition-colors ${
                form.type === t.value
                  ? "border-copper bg-copper/14 text-champagne"
                  : "border-ivory/15 text-ivory/60 hover:border-copper/50"
              }`}
            >
              <input
                type="radio"
                name="type"
                value={t.value}
                checked={form.type === t.value}
                onChange={set("type")}
                className="sr-only"
              />
              {t.label}
            </label>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-ivory/40">
          {TYPES.find((t) => t.value === form.type)?.hint}
        </p>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your name *" error={errors.name}>
          <input required value={form.name} onChange={set("name")} className="field" autoComplete="name" placeholder="Priya Sharma" />
        </Field>
        <Field label="Business name" error={errors.businessName}>
          <input value={form.businessName} onChange={set("businessName")} className="field" autoComplete="organization" placeholder="StyleHub Delhi" />
        </Field>
        <Field label="Phone number *" error={errors.phone}>
          <input
            required
            inputMode="tel"
            value={form.phone}
            onChange={set("phone")}
            className="field"
            autoComplete="tel"
            placeholder="+91 98XXXXXXXX"
          />
        </Field>
        <Field label="Email" error={errors.email}>
          <input type="email" value={form.email} onChange={set("email")} className="field" autoComplete="email" placeholder="you@business.com" />
        </Field>
        <Field label="City" error={errors.city}>
          <input value={form.city} onChange={set("city")} className="field" placeholder="Mumbai" />
        </Field>
        <Field label="Estimated quantity" error={errors.quantity}>
          <input value={form.quantity} onChange={set("quantity")} className="field" placeholder="500 pieces" />
        </Field>
      </div>

      <Field label="Interested products" error={errors.products}>
        <input
          value={form.products}
          onChange={set("products")}
          className="field"
          placeholder="Embroidered jackets, co-ord sets, kurtis"
        />
      </Field>

      <Field label="Message" error={errors.message}>
        <textarea
          rows={compact ? 3 : 4}
          value={form.message}
          onChange={set("message")}
          className="field resize-y"
          placeholder="Target price per piece, delivery window, fabric preference, private label requirements…"
        />
      </Field>

      {state === "error" && result.message && (
        <p className="rounded border border-danger/45 bg-danger/10 px-3 py-2 text-[12.5px] text-danger" role="alert">
          {result.message}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={state === "sending"} className="btn-solid sheen">
          {state === "sending" ? (
            <>
              <Loader2 size={15} className="animate-spin" /> Sending…
            </>
          ) : (
            <>
              <Send size={15} /> Submit Enquiry
            </>
          )}
        </button>
        <p className="text-[11px] leading-relaxed text-ivory/40">
          We use these details only to answer your enquiry. No marketing lists.
        </p>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block min-w-0">
      <span className="label">{label}</span>
      {children}
      {error && <span className="mt-1 block text-[11px] text-danger">{error}</span>}
    </label>
  );
}

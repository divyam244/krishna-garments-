"use client";

import { useState } from "react";
import { KeyRound, Globe, Bell, History, ShieldCheck } from "lucide-react";
import DataTable from "@/components/owner/DataTable";
import FormModal, { type Field } from "@/components/owner/FormModal";
import { PageHeader } from "./OrdersManager";
import { Stat } from "./InventoryManager";
import { money, num, date as fmtDate } from "@/lib/format";
import { useSite } from "@/components/providers/SiteProviders";

export type BusinessSetting = { key: string; value: string };
export type AuditRow = {
  id: string;
  action: string;
  entity: string;
  entityId?: string | null;
  performedBy?: string;
  createdAt: string;
};

const SETTINGS_GROUP: Record<string, { group: string; fields: string[] }> = {
  contact: { group: "Contact", fields: ["businessEmail", "businessPhone", "whatsappNumber"] },
  store: { group: "Store", fields: ["shippingThreshold", "currency", "timezone"] },
};

export default function SettingsManager({
  settings,
  audit,
}: {
  settings: BusinessSetting[];
  audit: AuditRow[];
}) {
  const { toast } = useSite();
  const [openTab, setOpenTab] = useState<"password" | "business" | "audit">("password");
  const [updating, setUpdating] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [pwdBusy, setPwdBusy] = useState(false);
  const [pwdError, setPwdError] = useState("");
  const [pwdOpen, setPwdOpen] = useState(false);

  // Build a map from settings rows keyed by key for inline editing.
  const merged = settings.reduce<Record<string, string>>((acc, s) => {
    acc[s.key] = s.value;
    return acc;
  }, {});

  async function updateSetting(key: string, value: string) {
    setUpdating((u) => ({ ...u, [key]: value }));
    try {
      const res = await fetch("/api/owner/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Could not save setting.");
      toast(`${settings.find((s) => s.key === key)?.key || key} updated`, "success");
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setUpdating((u) => {
        const n = { ...u };
        delete n[key];
        return n;
      });
    }
  }

  async function changePassword(data: Record<string, string | number | boolean>) {
    setPwdBusy(true);
    setPwdError("");
    try {
      const res = await fetch("/api/owner/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: String(data.currentPassword),
          newPassword: String(data.newPassword),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Could not update the password.");
      toast(json.message ?? "Password updated.", "success");
      setPwdOpen(false);
    } catch (e) {
      setPwdError((e as Error).message);
    } finally {
      setPwdBusy(false);
    }
  }

  const pwdFields: Field[] = [
    { name: "currentPassword", label: "Current password", type: "password", required: true, placeholder: "Current password" },
    { name: "newPassword", label: "New password (12+ characters)", type: "password", required: true, placeholder: "A new strong password" },
  ];

  const contactFields: Field[] = [
    { name: "businessEmail", label: "Business email", type: "email", placeholder: "info@krishnagarments.example" },
    { name: "businessPhone", label: "Business phone", type: "tel", placeholder: "+91 98765 43210" },
    { name: "whatsappNumber", label: "WhatsApp number", type: "tel", placeholder: "+91 98765 43210" },
    { name: "shippingThreshold", label: "Free shipping threshold (₹)", type: "number", placeholder: "4999", help: "Orders above this value qualify for free shipping." },
  ];

  const storeFields: Field[] = [
    { name: "currency", label: "Currency", type: "select", options: [{ value: "INR", label: "Indian Rupee (₹)" }] },
    { name: "timezone", label: "Business timezone", type: "select", options: [{ value: "Asia/Kolkata", label: "Asia/Kolkata (IST)" }] },
  ];

  return (
    <>
      <PageHeader title="Settings" subtitle="Security, business details and the system audit log." >
        <button type="button" onClick={() => setPwdOpen(true)} className="btn-solid btn-sm">
          <KeyRound size={14} /> Change password
        </button>
      </PageHeader>

      {/* Tabs */}
      <div className="mb-5 border-b border-copper/20">
        <nav aria-label="Settings tabs" className="flex gap-4">
          {[
            { id: "password", label: "Password", icon: ShieldCheck },
            { id: "business", label: "Business", icon: Globe },
            { id: "audit", label: "Audit log", icon: History },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setOpenTab(t.id as any)}
              className={`flex items-center gap-2 border-b-2 px-3 py-2.5 text-[11.5px] uppercase tracking-[0.16em] transition-colors ${
                openTab === t.id
                  ? "border-copper text-champagne"
                  : "border-transparent text-ivory/45 hover:text-champagne/70"
              }`}
            >
              <t.icon size={14} />
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {openTab === "password" && (
        <div className="space-y-4">
          <div className="card p-5">
            <div className="mb-3 flex items-center gap-2">
              <ShieldCheck size={16} className="text-copper" />
              <h3 className="font-display text-[18px]">Account security</h3>
            </div>
            <p className="text-[13px] text-ivory/50 leading-relaxed">
              Rotate your password whenever you suspect a leak, or after sharing access with contractors. A password change invalidates every other signed-in device and forces a fresh session.
            </p>
            {error && <p role="alert" className="mt-3 rounded border border-danger/45 bg-danger/10 px-3 py-2 text-[12.5px] text-danger">{error}</p>}
            <button type="button" onClick={() => setPwdOpen(true)} className="mt-4 btn-solid btn-sm sheen">
              <KeyRound size={13} /> Open password dialog
            </button>
          </div>

          <div className="card p-5">
            <div className="mb-3 flex items-center gap-2">
              <KeyRound size={16} className="text-copper" />
              <h3 className="font-display text-[18px]">Rules we enforce</h3>
            </div>
            <ul className="list-disc space-y-1.5 pl-5 text-[13px] text-ivory/60">
              <li>At least 12 characters — we store it with Argon2id, so length is your friend.</li>
              <li>The new password must differ from the current one.</li>
              <li>Your old token is destroyed on change, so other devices must sign in again.</li>
            </ul>
          </div>
        </div>
      )}

      {openTab === "business" && (
        <div className="space-y-4">
          <div className="card p-5">
            <div className="mb-4 flex items-center gap-2">
              <Globe size={16} className="text-copper" />
              <h3 className="font-display text-[18px]">Contact details</h3>
            </div>
            <dl className="grid gap-4 sm:grid-cols-2">
              {Object.keys(SETTINGS_GROUP.contact).map((key) => (
                <div key={key}>
                  <dt className="text-[10px] uppercase tracking-[0.16em] text-ivory/40">{key.replace(/([A-Z])/g, " $1").trim()}</dt>
                  <dd className="mt-1 flex items-center gap-2">
                    <input
                      value={merged[key] ?? ""}
                      onChange={(e) => updateSetting(key, e.target.value)}
                      disabled={!!updating[key]}
                      placeholder={`Enter ${key.replace(/([A-Z])/g, " $1").trim()}`}
                      className={`field ${updating[key] ? "animate-pulse bg-espresso/30" : ""}`}
                    />
                    {updating[key] && <span className="text-[10.5px] text-copper">saving…</span>}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="card p-5">
            <div className="mb-4 flex items-center gap-2">
              <Bell size={16} className="text-copper" />
              <h3 className="font-display text-[18px]">Store defaults</h3>
            </div>
            <dl className="grid gap-4 sm:grid-cols-2">
              {Object.keys(SETTINGS_GROUP.store).map((key) => (
                <div key={key}>
                  <dt className="text-[10px] uppercase tracking-[0.16em] text-ivory/40">{key.replace(/([A-Z])/g, " $1").trim()}</dt>
                  <dd className="mt-1 flex items-center gap-2">
                    <input
                      value={merged[key] ?? ""}
                      onChange={(e) => updateSetting(key, e.target.value)}
                      disabled={!!updating[key]}
                      placeholder={`Enter ${key.replace(/([A-Z])/g, " $1").trim()}`}
                      className={`field ${updating[key] ? "animate-pulse bg-espresso/30" : ""}`}
                    />
                    {updating[key] && <span className="text-[10.5px] text-copper">saving…</span>}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      )}

      {openTab === "audit" && (
        <DataTable
          rows={audit}
          rowKey={(r) => r.id}
          emptyText="No audit events recorded yet."
          searchable={false}
          columns={[
            { key: "action", header: "Action", render: (r) => <span className="text-champagne">{r.action}</span>, search: (r) => r.action },
            { key: "entity", header: "Entity", render: (r) => <span className="text-ivory/70">{r.entity}{r.entityId ? ` • ${r.entityId}` : ""}</span> },
            { key: "performedBy", header: "By", render: (r) => <span className="text-ivory/70">{r.performedBy || "system"}</span> },
            { key: "createdAt", header: "When", render: (r) => <span className="whitespace-nowrap text-ivory/55">{fmtDate(r.createdAt)}</span>, search: (r) => r.createdAt },
          ]}
        />
      )}

      {pwdOpen && (
        <FormModal
          title="Change password"
          fields={pwdFields}
          busy={pwdBusy}
          error={pwdError}
          submitLabel="Rotate password"
          onSubmit={changePassword}
          onClose={() => { setPwdOpen(false); setPwdError(""); }}
        />
      )}
    </>
  );
}

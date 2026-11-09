import { db } from "@/lib/db";
import { getCurrentOwner } from "@/lib/auth/session";
import SettingsManager, { type BusinessSetting, type AuditRow } from "@/components/owner/managers/SettingsManager";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const owner = await getCurrentOwner();
  if (!owner) return <div className="card p-8 text-center">You must be signed in to view settings.</div>;

  const [settings, audit] = await Promise.all([
    db.setting.findMany({ orderBy: { key: "asc" } }),
    db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 100 }).then((rows) => rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }))),
  ]);

  return <SettingsManager settings={settings} audit={audit} />;
}
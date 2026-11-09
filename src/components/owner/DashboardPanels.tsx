import Link from "next/link";
import { ArrowRight, Boxes, CreditCard, Scissors } from "lucide-react";
import type { DashboardData } from "@/lib/owner/dashboard";
import { compactMoney, daysFromNow, money, num } from "@/lib/format";
import { garmentArt } from "@/lib/art";

/** The three mid-row panels from the reference: Low Stock / Pending Payments / Production. */
export default function DashboardPanels({ data }: { data: DashboardData }) {
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      {/* Low stock */}
      <Panel
        icon={<Boxes size={19} strokeWidth={1.5} className="text-copper" />}
        title="Low Stock Items"
        href="/owner/inventory"
      >
        <ul className="flex flex-col divide-y divide-copper/12">
          {data.lowStock.length === 0 && <Empty text="No items below threshold." />}
          {data.lowStock.map((s) => (
            <li key={s.name} className="flex items-center gap-3 py-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={s.image || garmentArt("jacket", { width: 120 })}
                alt=""
                className="h-11 w-9 shrink-0 rounded object-cover opacity-85"
              />
              <span className="min-w-0 flex-1 truncate text-[13.5px] text-ivory/80">{s.name}</span>
              <span
                className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] tabular-nums ${
                  s.severity === "critical"
                    ? "border-danger/50 bg-danger/12 text-danger"
                    : "border-copper/45 bg-espresso text-champagne"
                }`}
              >
                {num(s.qty)} pcs
              </span>
            </li>
          ))}
        </ul>
      </Panel>

      {/* Pending payments */}
      <Panel
        icon={<CreditCard size={19} strokeWidth={1.5} className="text-copper" />}
        title="Pending Payments"
        href="/owner/payments"
      >
        <ul className="flex flex-col divide-y divide-copper/12">
          {data.pendingPaymentList.length === 0 && (
            <Empty text={data.source === "database" ? "Nothing outstanding — well managed." : "No payment records yet."} />
          )}
          {data.pendingPaymentList.map((p) => {
            const due = daysFromNow(p.dueDate);
            return (
              <li key={p.customer} className="flex items-center gap-3 py-3">
                <span className="min-w-0 flex-1 truncate text-[13.5px] text-ivory/80">{p.customer}</span>
                <span className="shrink-0 text-[13px] tabular-nums text-champagne">{money(p.amount)}</span>
                <span
                  className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] ${
                    due.overdue ? "border-danger/50 bg-danger/12 text-danger" : "border-copper/45 bg-espresso text-champagne"
                  }`}
                >
                  {due.label}
                </span>
              </li>
            );
          })}
        </ul>
      </Panel>

      {/* Production progress */}
      <Panel
        icon={<Scissors size={19} strokeWidth={1.5} className="text-copper" />}
        title="Production Progress"
        href="/owner/production"
      >
        <ul className="flex flex-col gap-4">
          {data.production.length === 0 && <Empty text="No open batches right now." />}
          {data.production.slice(0, 2).map((b) => (
            <li key={b.batchNo} className="flex gap-3.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={b.image || garmentArt("jacket", { width: 120 })}
                alt=""
                className="h-16 w-12 shrink-0 rounded object-cover opacity-85"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] text-ivory/85">{b.productName}</p>
                <p className="mt-0.5 text-[11px] uppercase tracking-[0.14em] text-ivory/40">Batch #{b.batchNo}</p>

                <div className="mt-2.5 flex items-center gap-3">
                  <span className="relative h-2 flex-1 overflow-hidden rounded-full bg-charcoal">
                    <span
                      className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-copper to-champagne transition-[width] duration-700"
                      style={{ width: `${b.progressPct}%` }}
                    />
                  </span>
                  <span className="w-9 shrink-0 text-right text-[12px] tabular-nums text-champagne">{b.progressPct}%</span>
                </div>

                <p className="mt-1.5 text-[11.5px] tabular-nums text-ivory/45">
                  {num(b.completed)} / {num(b.target)} Units
                </p>
              </div>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

function Panel({
  icon,
  title,
  href,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card flex flex-col p-5 md:p-6">
      <header className="mb-3 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2.5 font-display text-[20px]">
          {icon}
          {title}
        </h2>
        <Link
          href={href}
          className="group flex shrink-0 items-center gap-1 text-[11px] uppercase tracking-[0.14em] text-champagne hover:text-ivory"
        >
          View All
          <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
        </Link>
      </header>
      <div className="flex-1">{children}</div>
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return <li className="py-6 text-center text-[12.5px] text-ivory/40">{text}</li>;
}

import { getDashboard } from "@/lib/owner/dashboard";
import KpiRow from "@/components/owner/KpiRow";
import SalesTrendChart from "@/components/owner/SalesTrendChart";
import OrderStatusDonut from "@/components/owner/OrderStatusDonut";
import DashboardPanels from "@/components/owner/DashboardPanels";
import { QuickActions } from "@/components/owner/QuickActions";
import { Calendar, Bell, User } from "lucide-react";

export const dynamic = "force-dynamic";

/** Section 13 — main owner dashboard, matching Image 2 reference design. */
export default async function OwnerDashboardPage() {
  const data = await getDashboard();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  return (
    <>
      {/* Header bar matching Image 2 */}
      <header className="relative mb-6 overflow-hidden rounded-xl border border-copper/30 bg-gradient-to-r from-espresso/80 via-deep to-charcoal px-6 py-5 shadow-card">
        <div className="pointer-events-none absolute -right-10 -top-16 h-52 w-72 rounded-full bg-champagne/8 blur-3xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-3 font-display text-[27px] leading-tight md:text-[34px] text-ivory">
              <span className="h-7 w-[3px] rounded-full bg-gradient-to-b from-champagne to-copper" />
              {greeting}, Owner 👋
            </h1>
            <p className="mt-1.5 pl-4 text-[13px] text-ivory/60">
              Here&apos;s your business overview at Krishna Garments.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Date filter dropdown pill */}
            <div className="flex items-center gap-2 rounded-lg border border-copper/35 bg-espresso/60 px-3.5 py-1.5 text-[12.5px] text-ivory/80 shadow-sm">
              <Calendar size={14} className="text-copper" />
              <span>Last 30 Days</span>
              <span className="text-[10px] text-copper">▼</span>
            </div>

            {/* Notification bell */}
            <button
              type="button"
              className="relative grid h-9 w-9 place-items-center rounded-full border border-copper/35 bg-espresso/60 text-ivory/70 hover:border-copper hover:text-champagne transition-all"
              aria-label="Notifications"
            >
              <Bell size={15} />
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-copper" />
            </button>

            {/* Profile Avatar circle */}
            <div className="grid h-9 w-9 place-items-center rounded-full border border-copper/50 bg-gradient-to-br from-copper/30 to-espresso text-champagne shadow-sm">
              <User size={16} />
            </div>
          </div>
        </div>
      </header>

      <KpiRow data={data} />

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        <SalesTrendChart data={data.salesTrend} />
        <OrderStatusDonut data={data} />
      </div>

      <div className="mt-5">
        <DashboardPanels data={data} />
      </div>

      <div className="mt-5">
        <QuickActions />
      </div>
    </>
  );
}

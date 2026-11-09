import { getDashboard } from "@/lib/owner/dashboard";
import KpiRow from "@/components/owner/KpiRow";
import SalesTrendChart from "@/components/owner/SalesTrendChart";
import OrderStatusDonut from "@/components/owner/OrderStatusDonut";
import DashboardPanels from "@/components/owner/DashboardPanels";
import { QuickActions } from "@/components/owner/QuickActions";

export const dynamic = "force-dynamic";

/** Section 13 — main owner dashboard, laid out to match the reference image. */
export default async function OwnerDashboardPage() {
  const data = await getDashboard();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  return (
    <>
      {/* Greeting bar */}
      <header className="relative mb-6 overflow-hidden rounded-xl border border-copper/25 bg-gradient-to-r from-espresso/80 via-deep to-charcoal px-6 py-5">
        <div className="pointer-events-none absolute -right-10 -top-16 h-52 w-72 rounded-full bg-champagne/8 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-3 font-display text-[27px] leading-tight md:text-[34px]">
              <span className="h-7 w-[3px] rounded-full bg-gradient-to-b from-champagne to-copper" />
              {greeting}, Owner 👋
            </h1>
            <p className="mt-1.5 pl-4 text-[13px] text-ivory/55">
              Here&apos;s your business overview at Krishna Garments.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {data.source === "sample" && (
              <span className="sample-tag">Sample figures — database not connected</span>
            )}
            <span className="chip">{new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span>
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

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { LogOut, ExternalLink } from "lucide-react";
import { getCurrentOwner, destroyCurrentSession } from "@/lib/auth/session";
import OwnerSidebar from "@/components/owner/OwnerSidebar";

export const metadata: Metadata = {
  title: "Owner Panel",
  robots: { index: false, follow: false },
};

/** Server-side authorization boundary for the whole owner area. */
export default async function OwnerLayout({ children }: { children: React.ReactNode }) {
  const headerList = await headers();
  const pathname = headerList.get("x-pathname") || "";

  // Allow login route without wrapping in sidebar and without redirect loop
  if (pathname === "/owner/login") {
    return <>{children}</>;
  }

  const owner = await getCurrentOwner();
  if (!owner) redirect("/owner/login");

  return (
    <div className="flex min-h-screen bg-charcoal">
      <OwnerSidebar owner={owner} />

      <div className="flex min-w-0 flex-1 flex-col lg:pl-[264px]">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-copper/20 bg-charcoal/95 px-5 py-3 backdrop-blur-xl md:px-8">
          <div className="flex items-center gap-3 lg:hidden">
            <span className="font-display text-lg tracking-[0.14em]">KRISHNA</span>
            <span className="chip !text-[9px]">Owner</span>
          </div>

          <p className="hidden text-[12px] text-ivory/45 lg:block">
            Signed in as <span className="text-champagne">{owner.displayName}</span> · {owner.username}
          </p>

          <div className="ml-auto flex items-center gap-2">
            <Link href="/" target="_blank" className="btn-ghost btn-sm">
              View site <ExternalLink size={13} />
            </Link>
            <form
              action={async () => {
                "use server";
                await destroyCurrentSession();
                redirect("/owner/login");
              }}
            >
              <button type="submit" className="btn-outline btn-sm" aria-label="Sign out of the owner panel">
                <LogOut size={13} /> Sign out
              </button>
            </form>
          </div>
        </header>

        <main className="flex-1 px-5 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}

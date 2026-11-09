import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentOwner } from "@/lib/auth/session";
import OwnerLoginForm from "@/components/owner/OwnerLoginForm";

export const metadata: Metadata = {
  title: "Owner Sign in",
  robots: { index: false, follow: false },
};

export default async function OwnerLoginPage() {
  // Already authenticated -> straight to the dashboard.
  if (await getCurrentOwner()) redirect("/owner");

  return <OwnerLoginForm />;
}

import type { Metadata } from "next";
import CustomerDashboardView from "@/components/account/CustomerDashboardView";

export const metadata: Metadata = {
  title: "My Account | KRISHNA GARMENTS",
  description: "Customer portal for KRISHNA GARMENTS — manage orders, saved addresses, wardrobe wishlist, and biometric passkeys.",
};

export default function AccountPage() {
  return (
    <div className="mx-auto max-w-[1300px] px-6 pb-24 pt-28 md:px-10 md:pt-32">
      <CustomerDashboardView />
    </div>
  );
}
